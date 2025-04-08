---
title: "Enforcing max query depth with Absinthe"
description: "A practical guide to implementing GraphQL query depth limits in Elixir using Absinthe."
date: "Apr 8 2025"
---

[Absinthe](https://hex.pm/packages/absinthe) is a popular GraphQL library for Elixir. It's the de-facto choice if you want to publish a GQL API. Vetspire uses it for its public API, where at peak we handle upward of 80 000 requests/minute.

As it's up to the API clients to decide what they query, there is complexity and challenge to securing your API. Some strategies include:

- Enforcing a timeout
- Rate limiting
- Complexity limits
- Enforcing max query depth

You can find out more about these at [How to GraphQL](https://www.howtographql.com/advanced/4-security/) website. While you probably want to investigate all of these strategies and consider mix & matching all depending on your needs, this article will focus on the last one.

## The problem

GraphQL schemas often are cyclic graphs (hence the name), allowing you to craft queries such as:

```graphql
query IAmEvil {
  author(id: "abc") {
    posts {
      author {
        posts {
          author {
            posts {
              author {
                # that could go on as deep as the client wants!
              }
            }
          }
        }
      }
    }
  }
}
```

Even if your users are not malicious, they might be able to craft queries which are less than ideal. In our case, we found some of our API users reaching a depth of 10+, requesting a ton of data in the process, which turned out to be less efficient than if you were to split this query up.

## Simple solution

Absinthe doesn't seem to offer max query depth as a configuration option. [The Safety Limits](https://hexdocs.pm/absinthe/complexity-analysis.html) page in the documentation covers the ability to set complexity per field and enforce a limit as well as token limits.

Googling for it yielded a helpful StackOverflow post [Absinthe Graphql nested queries security](https://stackoverflow.com/questions/53287893/absinthe-graphql-nested-queries-security) where Marcos Tapajós suggests:

> You can write a middleware to check the selection_depth and block it. Something like that:

```elixir
@impl Absinthe.Middleware
def call(res, _config) do
  IO.inspect(selection_depth(res.definition.selections))
  res
end
def selection_depth([], depth), do: depth + 1
def selection_depth(selections, depth \\ 0),
  do: selections |> Enum.map(&selection_depth(&1.selections, depth + 1)) |> Enum.max()
```

Let's try it out! Here's a [middleware](https://hexdocs.pm/absinthe/Absinthe.Middleware.html) that utilises this logic:

```elixir
defmodule AppWeb.Middleware.MaxQueryDepth do
  @moduledoc """
  Middleware that allows us to refuse queries that have a depth greater than a
  certain value.
  """
  @behaviour Absinthe.Middleware

  require Logger

  def call(resolution, _config) do
    selection_depth = selection_depth(resolution.definition.selections)

    max_query_depth = max_query_depth()

    if selection_depth > max_query_depth do
      Absinthe.Resolution.put_result(
        resolution,
        {:error,
         %{
           code: :query_depth_limit,
           message:
             "Query has depth of #{selection_depth}, which exceeds max depth of #{max_query_depth}."
         }}
      )
    else
      resolution
    end
  end

  def selection_depth(selections \\ [], depth \\ 0)
  def selection_depth([] = _selections, depth), do: depth + 1

  def selection_depth(selections, depth),
    do: selections |> Enum.map(&selection_depth(&1.selections, depth + 1)) |> Enum.max()

  defp max_query_depth, do: Application.get_env(:app_web, :max_query_depth)
end
```

Note that we configure `max_query_depth` via `runtime.exs` so that we can change the limit depending on environment.

We include this in our default middleware across the entire schema:

```elixir
defmodule AppWeb.Schema do
  use Absinthe.Schema

  def middleware(middleware, _field, _object) do
    middleware ++ [AppWeb.Middleware.MaxQueryDepth]
  end
end
```

## Testing

We should try it out - better yet, let's write a test case for this middleware:

```elixir
defmodule AppWeb.Middleware.MaxQueryDepthTest do
  use AppWeb.ConnCase, async: true

  @sample_query """
  query {
    org {
      id
      providers {
        id
        org {
          id
          providers {
            id
            org {
              id
            }
          }
        }
      }
    }
  }
  """

  describe "max_query_depth" do
    test "returns results when limit isn't reached", ctx do
      Application.put_env(:app_web, :max_query_depth, 50)
      assert %{"id" => _id, "providers" => _providers} = run_graphql!(ctx.conn, @sample_query)
    end

    test "returns an error when limit is reached", ctx do
      Application.put_env(:app_web, :max_query_depth, 5)

      assert %{
               "errors" => [
                 %{
                   "code" => "query_depth_limit",
                   "message" => "Query has depth of 5, which exceeds max depth of 4."
                 }
               ]
             } = run_graphql(ctx.conn, @sample_query)

      Application.put_env(:app_web, :max_query_depth, 50)
    end
  end
end
```

We have some utility functions that make this test simpler:

- our default context has a `conn` set up
- we have utility `run_graphql` function that boils down to this:

```elixir
conn
|> post("/graphql", query: query)
|> json_response(200)
```

In any case, we just proved the code works! Thanks Marcus, even if your answer is from 2018, it still holds up!

## Handling fragments

Unfortunately, upon further testing, I found an issue where if you utilise GraphQL fragments, you can fool the logic we have implemented. Let's write a test for it:

```elixir
@query_with_fragments """
query getNotifications {
  notifications {
    ...NotificationBasics
  }
}

fragment NotificationBasics on Notification {
  id
  patient {
    ...PatientDetails
  }
}

fragment PatientDetails on Patient {
  id
  name
  client {
    ...ClientDetails
  }
}

fragment ClientDetails on Client {
  id
  name
  patients {
    name
    client {
      id
    }
  }
}
"""
test "query with fragments is forbidden when it exceeds the limit", ctx do
  Application.put_env(:app_web, :max_query_depth, 5)

  assert %{
            "errors" => [
              %{
                "code" => "query_depth_limit",
                "message" => "Query has depth of 6, which exceeds max depth of 5."
              }
            ]
          } = run_graphql(ctx.conn, @query_with_fragments)

  Application.put_env(:app_web, :max_query_depth, 50)
end
```

This ends up causing an error in the implementation we have:

```elixir
** (KeyError) key :selections not found in: %Absinthe.Blueprint.Document.Fragment.Spread{
  name: "NotificationBasics",
  directives: [],
  source_location: %Absinthe.Blueprint.SourceLocation{line: 3, column: 5},
  complexity: 8,
  flags: %{},
  errors: []
}
```

This is because our current `selection_depth` implementation assumes every selection has a `selections` key, but the first fragment we're looking at looks like this:

```elixir
%Absinthe.Blueprint.Document.Fragment.Spread{
  name: "NotificationBasics",
  directives: [],
  source_location: %Absinthe.Blueprint.SourceLocation{line: 3, column: 5},
  complexity: 8,
  flags: %{},
  errors: []
}
```

To resolve this, we can reach for `resolution.fragments` which has the definition of the fragments. It's a map with every fragment; let's take a look at our `NotificationBasics` - mind you, these structs are huge, so included here is simplified version:

```elixir
%Absinthe.Blueprint.Document.Fragment.Named{
  name: "NotificationBasics",
  selections: [
    %Absinthe.Blueprint.Document.Field{
      name: "patient",
      selections: [
        %Absinthe.Blueprint.Document.Fragment.Spread{
          name: "PatientDetails",
          complexity: 7,
          errors: []
        }
      ],
    }
  ],
}
```

This tells us that this fragment has `selections` which include another fragment -- which allows us to recursively look them all up till we get to the bottom of it.

Let's change our `selection_depth/` function to take the definition of the fragments, so we can look them up and let's dive deep into selections till there's nothing else:

```elixir
def selection_depth(fragments \\ [], selections \\ [], depth \\ 0)
def selection_depth(_fragments, selections, depth) when selections == [], do: depth + 1

def selection_depth(fragments, selections, depth) do
  selections
  |> Enum.map(fn selection ->
    case selection do
      %Absinthe.Blueprint.Document.Fragment.Spread{} = fragment ->
        selections =
          fragments
          |> Enum.find(fn {name, _} -> name == fragment.name end)
          |> elem(1)
          |> Map.get(:selections)

        selection_depth(fragments, selections, depth)

      field ->
        selection_depth(fragments, field.selections, depth + 1)
    end
  end)
  |> Enum.max()
end
```

Let's change how we call `selection_depth/3`:

```elixir
selection_depth =
  selection_depth(resolution.fragments, resolution.definition.selections)
```

It might not be the prettiest code, but our test now passes!

## Benchmarking

I didn't realise this at first, but the middleware is called for every field in the query. There might be a way to do it once per query (please let me know your thoughts!), but I wanted to benchmark this code to ensure we're not slowing it down. I figured it might be OK as we're just performing quick lookups on maps, but I wanted to be sure.

We can use [benchee]() to benchmark this:

In our case, we also used [fun_with_flags]() to enable or disable the feature altogether, which allows us to easily test both versions:

```elixir
Benchee.run(
  %{
    "with_max_query_depth" => {
      fn _input -> VetspireWeb.Support.TestUtils.run_graphql!(conn, sample_query) end,
      before_scenario: fn _input -> FunWithFlags.enable(:FeatureMaxQueryDepth) end,
      after_scenario: fn _input -> FunWithFlags.disable(:FeatureMaxQueryDepth) end
    },
    "without_max_query_depth" => fn ->
      VetspireWeb.Support.TestUtils.run_graphql!(conn, sample_query)
    end
  },
  time: 10,
  memory_time: 2
)
```

The results:

```bash
Name                              ips        average  deviation         median         99th %
with_max_query_depth            15.81       63.27 ms     ±6.35%       61.84 ms       79.90 ms
without_max_query_depth         15.71       63.67 ms     ±6.83%       62.18 ms       82.49 ms

Comparison:
with_max_query_depth            15.81
without_max_query_depth         15.71 - 1.01x slower +0.40 ms

Memory usage statistics:

Name                            average  deviation         median         99th %
with_max_query_depth            1.54 MB     ±0.01%        1.54 MB        1.54 MB
without_max_query_depth         1.54 MB     ±0.00%        1.54 MB        1.54 MB

Comparison:
with_max_query_depth            1.54 MB
without_max_query_depth         1.54 MB - 1.00x memory usage +0.00008 MB
```

All in all, I didn't observe any performance difference!

## Release process

When we released this to production almost a year ago, I've done it in two steps:

1. Release the code that analyses the query depth and logs queries that hit a pre-defined high threshold. We chose to log anything above depth of 5 - just to observe what our API users do and see what seems reasonable. We had a graph to show us frequency for every instance of the API call reaching this threshold (it helps to establish a minimum to minise logs/noise in metrics). This also gave us an idea of what is the maximum reasonable depth based on the real usage.
2. As mentioned, we released it feature flagged at first - to ensure we don't observe a performance hit with a volume of users in production that would be hard to replicate in a benchmarking situation.

All in all, it's been successful and the code has been in production for almost a year now for us.

---
title: "GenStage for processing Jobs"
description: ""
date: "Jan 17 2017"
---

We use Elixir at uSwitch to process user-submitted forms, sending the data to a 3rd party API and parsing the output saving the results to a database. The high-level outline of the Elixir process as a recursive loop looks like this:

1. Long-running SQS request, as soon as a message is available, the request returns
2. For every message in the request, spawn a new process to handle it
3. Go to 1

This works great, but one of the issues we found is that this is a very greedy approach - if we received a spike in traffic, we'd try to spin up a lot of processes, each consuming some memory and it's possible the whole application would crash. Thanks to Supervisors, it would recover, but because the queue only got bigger, the problem would repeat.

It's clear we needed an alternative approach. Our first hotfix was to sleep for a few seconds after step 2, giving processes enough time to finish. We would then spin up multiples of the application to handle the load and minimise the effect of the artificial delay. Messy, but works.

## GenStage

This sounded like an excellent problem for GenStage; there's a Producer (SQS) and Consumer (form processor). The first iteration looked something like this:

```elixir
defmodule Producer do
  use GenStage

  def start_link() do
    GenStage.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  def init(:ok) do
    {:producer, :ok}
  end

  def handle_demand(demand, _state) do
    messages = SQS.get_messages

    {:noreply, messages, :ok}
  end
end

defmodule Consumer do
  use GenStage

  def start_link() do
    GenStage.start_link(__MODULE__, :ok)
  end

  def init(:ok) do
    {:consumer, :the_state_does_not_matter, subscribe_to: [Producer]}
  end

  def handle_events(messages, _from, _state) do
    messages
    |> Enum.map(&Task.start_link(Processor, :process_message, [&1]))

    {:noreply, [], :the_state_does_not_matter}
  end
end
```

When Consumers are started, they subscribe to the Producer and send demand for events. The `handle_demand` callback is called, SQS retrieves messages and passes them over to `handle_events` in Consumer, which in turn starts the individual Tasks to process jobs.

Unfortunately, if the long-running SQS request does not return anything (and in our case upper limit of 20s is reached), the demand is never fulfilled -- Another request is never created.

## Continous polling for messages

The [GenStage documentation](https://hexdocs.pm/gen_stage/GenStage.html) covers this scenario by using BroadcastDispatcher and keeping a queue and demand in the state of the producer. One part didn't quite fit our setup - having to manually call `sync_notify` to send events. We needed a way to continously request data and send it to Consumers if we received any messages.

The solution to that is to create a callback with `handle_cast` that calls itself recursively and call it once at startup:

```elixir
def handle_cast(:check_for_messages, state) do
  messages = SQS.get_messages

  GenStage.cast(__MODULE__, :check_for_messages)

  {:noreply, messages, state}
end

def handle_demand(demand, state) do
  GenStage.cast(__MODULE__, :check_for_messages)

  {:noreply, [], state}
end
```

When Consumers start, they call `handle_demand` which then starts a recursive loop; either returning some messages from SQS or empty list; those are passed to the Consumer and the whole thing works.

## Rate-limiting

The problem with the above is that if a traffic spike occurs, we'll continue to spawn new tasks until we run out of memory. To solve this, we've implemented DynamicSupervisor as the Consumer (in GenStage v0.11.0 renamed to [ConsumerSupervisor](https://hexdocs.pm/gen_stage/ConsumerSupervisor.html#content)). This allows us to specify `:max_demand` which dictates how many child processes can spawn.

In turn, the Producer doesn't know about this limit, so it will continue polling SQS and send events. Once max_demand is reached, it will start filling the internal buffer. In our case, we didn't want messages to be read from the queue until we knew we had the capacity to process them (as another instance of the application might be able to read them). By keeping the number of current demand from Consumers in Producer's state, we only request data from SQS when demand is there.

The combination of both these approaches looks like this:

```elixir
defmodule Producer do
  alias Experimental.GenStage
  use GenStage

  def start_link(state) do
    GenStage.start_link(__MODULE__, state, name: __MODULE__)
  end

  def init(state) do
    {:producer, state}
  end

  def handle_cast(:check_for_messages, 0) do
    {:noreply, [], 0}
  end
  def handle_cast(:check_messages, state) do
    messages = SQS.get_messages

    GenStage.cast(__MODULE__, :check_messages)

    {:noreply, messages, state - Enum.count(messages)}
  end

  def handle_demand(demand, state) do
    GenStage.cast(__MODULE__, :check_messages)

    {:noreply, [], demand+state}
  end
end

defmodule Consumer do
  alias Experimental.DynamicSupervisor
  use DynamicSupervisor

  def start_link() do
    DynamicSupervisor.start_link(__MODULE__, :ok)
  end

  def init(:ok) do
    children = [
      worker(Processor, [], restart: :temporary),
    ]

    {:ok, children, strategy: :one_for_one, subscribe_to: [{Producer, max_demand: 10, min_demand: 1}]}
  end
end

defmodule Processor do
  def start_link(message) do
    Task.start_link(__MODULE__, :process_message, [message])
  end

  def process_message(message) do
    # Do work here
    Logger.debug("Sleeping for 15s")
    :timer.sleep(15_000)
  end
end
```

The important part is keeping the number of available processes in state. As messages arrive, this number gets reduced. When we have 0 available processes, no SQS request is made. When the processes finish, the demand increases again.

This would ensure that at max, we'd have 10 tasks processing SQS messages. As soon as a SQS request returned messages, they'd be sent to new tasks, while a new SQS request would start, so we would have no delay between them.

It's also worth noting that our SQS request would return no more than one message at a time - otherwise we would have issues with potentially negative amount of consumers available.

All of this would be supervised when application is booted up:

```elixir
def start(_type, _args) do
  import Supervisor.Spec

  children = [
    worker(Producer, []),
    worker(Consumer, [])
  ]

  {:ok, pid} = Supervisor.start_link(children, strategy: :one_for_one)
end
```

## Cast vs send()

It's possible that [GenStage.cast/2](https://hexdocs.pm/gen_stage/GenStage.html#cast/2) is not the best choice for the GenStage process to send messages to itself. Perhaps it's more suitable for external processes - while you can use [Kernel.send/2](https://hexdocs.pm/elixir/Kernel.html#send/2) internally.

```elixir
def handle_info(:check_messages, 0), do: {:noreply, [], 0}
def handle_info(:check_messages, state) do
  Logger.debug("Reading from SQS... got #{state} workers ready")

  messages = SQS.receive_messages

  Process.send(self(), :check_messages, [])

  {:noreply, messages, state - Enum.count(messages)}
end

def handle_demand(demand, state) do
  send(self(), :check_messages)

  {:noreply, [], demand+state}
end
```

As far as we could tell, the behaviour is the same.

## Summary

There's a lot of moving parts to this architecture:

```
Supervisor -> Producer + (ConsumerSupervisor -> Processors)
```

However, for the amount of code needed, where a lot of it was boilerplate, it certainly felt quite easy to accomplish a rate-limited continuous background process that can recover when any of its parts fail.

Thank you to [Elixir Slack](https://elixir-slackin.herokuapp.com/) community for help figuring this out, in particular @sschneider and @hellopatrick ([Twitter](https://twitter.com/fells_init)). Any feedback is appreciated, please post comments on Reddit or reach out to me (@tomasztomczyk) in Slack!

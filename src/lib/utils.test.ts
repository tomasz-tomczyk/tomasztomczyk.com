/**
 * Tests for the small helpers.
 *
 * `tagSlug` is load-bearing: it turns free-form frontmatter into URLs, and
 * `assertNoTagCollisions` fails `astro build` when two distinct tags would
 * land on the same page. Run with `npm test`.
 */
import { tagSlug, assertNoTagCollisions, formatDate, readingTime } from "./utils.ts";

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures++;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  FAIL ${name}\n       ${message.split("\n")[0]}`);
  }
}

function eq<T>(actual: T, expected: T, what: string): void {
  if (actual !== expected) {
    throw new Error(`${what}: got ${String(actual)}, want ${String(expected)}`);
  }
}

function throws(fn: () => unknown, mustMention: string[], what: string): void {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const fragment of mustMention) {
      if (!message.includes(fragment)) {
        throw new Error(`${what}: error missing "${fragment}" — got: ${message}`);
      }
    }
    return;
  }
  throw new Error(`${what}: expected a throw, got none`);
}

console.log("tagSlug:");

check("passes through what is already a slug", () => {
  eq(tagSlug("elixir"), "elixir", "simple");
  eq(tagSlug("ci-cd"), "ci-cd", "hyphenated");
});

check("lowercases", () => eq(tagSlug("GraphQL"), "graphql", "case"));

check("turns spaces and punctuation into single hyphens", () => {
  eq(tagSlug("code review"), "code-review", "space");
  eq(tagSlug("CI/CD"), "ci-cd", "slash");
  eq(tagSlug("a  b   c"), "a-b-c", "runs collapse");
});

check("trims leading and trailing hyphens", () => {
  eq(tagSlug("  elixir  "), "elixir", "whitespace");
  eq(tagSlug("/elixir/"), "elixir", "slashes");
});

check("keeps digits", () => eq(tagSlug("Phoenix 1.7"), "phoenix-1-7", "digits"));

check("a tag with nothing slug-able is rejected", () =>
  throws(() => tagSlug("///"), ["///"], "empty slug"));

console.log("\nthe collision guard:");

check("distinct slugs pass", () => {
  assertNoTagCollisions(["elixir", "graphql", "ci-cd"]);
});

/* The reason the guard exists: free-form tags mean two spellings can collapse
   onto one URL, silently merging two tags into one page. */
check("THE BUG: two spellings collapsing to one slug", () =>
  throws(
    () => assertNoTagCollisions(["CI/CD", "ci-cd"]),
    ["ci-cd", "CI/CD"],
    "collision",
  ));

check("case-only differences collide", () =>
  throws(() => assertNoTagCollisions(["Elixir", "elixir"]), ["elixir"], "case collision"));

check("the same tag written identically twice is not a collision", () => {
  // Two posts sharing a tag is the normal case, not an error.
  assertNoTagCollisions(["elixir", "elixir", "graphql"]);
});

check("names every colliding pair, not just the first", () =>
  throws(
    () => assertNoTagCollisions(["CI/CD", "ci-cd", "Elixir", "elixir"]),
    ["ci-cd", "elixir"],
    "all collisions",
  ));

console.log("\nthe pre-existing helpers still work:");

check("formatDate", () =>
  eq(formatDate(new Date("2025-04-08T12:00:00Z")), "Apr 8, 2025", "date"));

check("readingTime counts words", () => {
  eq(readingTime("<p>" + "word ".repeat(400) + "</p>"), "3 min read", "400 words");
});

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);

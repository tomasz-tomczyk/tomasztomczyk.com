/**
 * Tests for the GraphQL-response-to-thread shaping. Run with `npm test`.
 *
 * `shapeDiscussion` is the only part of comments.ts worth testing: everything
 * else is one fetch. The cases below are the shapes GitHub actually returns
 * that a naive mapping gets wrong — a minimized comment, a deleted author,
 * and a reply whose parent is minimized.
 */
import { shapeDiscussion, shapeReactions, type RawDiscussion } from "./comments.ts";

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

function group(content: string, totalCount: number) {
  return { content, reactors: { totalCount } };
}

function comment(over: Partial<RawDiscussion["comments"]["nodes"][number]> = {}) {
  return {
    reactionGroups: [],
    id: "C_1",
    url: "https://github.com/o/r/discussions/1#discussioncomment-1",
    createdAt: "2026-09-01T10:00:00Z",
    bodyHTML: "<p>Hello</p>",
    isMinimized: false,
    author: { login: "someone", url: "https://github.com/someone", avatarUrl: "https://a/1" },
    replies: { nodes: [] },
    ...over,
  };
}

function discussion(nodes: RawDiscussion["comments"]["nodes"]): RawDiscussion {
  return {
    number: 1,
    url: "https://github.com/o/r/discussions/1",
    reactionGroups: [],
    comments: { nodes },
  };
}

console.log("shapeDiscussion");

check("keeps an ordinary comment", () => {
  const thread = shapeDiscussion(discussion([comment()]));
  eq(thread.comments.length, 1, "count");
  eq(thread.comments[0]!.author.login, "someone", "login");
  eq(thread.comments[0]!.bodyHTML, "<p>Hello</p>", "body");
});

check("drops a minimized comment", () => {
  // This is how hiding a comment on GitHub removes it from the site.
  const thread = shapeDiscussion(
    discussion([comment({ id: "C_1" }), comment({ id: "C_2", isMinimized: true })]),
  );
  eq(thread.comments.length, 1, "count");
  eq(thread.comments[0]!.id, "C_1", "survivor");
});

check("drops a minimized reply but keeps its parent", () => {
  const thread = shapeDiscussion(
    discussion([
      comment({
        replies: {
          nodes: [
            comment({ id: "R_1" }),
            comment({ id: "R_2", isMinimized: true }),
          ],
        },
      }),
    ]),
  );
  eq(thread.comments.length, 1, "parents");
  eq(thread.comments[0]!.replies.length, 1, "replies");
  eq(thread.comments[0]!.replies[0]!.id, "R_1", "surviving reply");
});

check("keeps replies to a minimized parent out entirely", () => {
  // Hiding a parent hides the sub-thread: a reply rendered without the comment
  // it answers reads as a non-sequitur.
  const thread = shapeDiscussion(
    discussion([comment({ isMinimized: true, replies: { nodes: [comment({ id: "R_1" })] } })]),
  );
  eq(thread.comments.length, 0, "count");
});

check("marks a comment by the site's owner as the author", () => {
  const mine = shapeDiscussion(
    discussion([comment({ author: { login: "tomasz-tomczyk", url: "u", avatarUrl: null } })]),
  );
  eq(mine.comments[0]!.isAuthor, true, "owner");

  const theirs = shapeDiscussion(discussion([comment()]));
  eq(theirs.comments[0]!.isAuthor, false, "someone else");
});

check("does not call a deleted account the author", () => {
  eq(shapeDiscussion(discussion([comment({ author: null })])).comments[0]!.isAuthor, false, "ghost");
});

check("renders a deleted account as ghost", () => {
  const thread = shapeDiscussion(discussion([comment({ author: null })]));
  eq(thread.comments[0]!.author.login, "ghost", "login");
  eq(thread.comments[0]!.author.url, "https://github.com/ghost", "url");
});

check("counts every surviving comment, replies included", () => {
  const thread = shapeDiscussion(
    discussion([
      comment({ replies: { nodes: [comment({ id: "R_1" }), comment({ id: "R_2" })] } }),
      comment({ id: "C_2" }),
    ]),
  );
  eq(thread.total, 4, "total");
});

check("total is zero for a discussion nobody replied to", () => {
  const thread = shapeDiscussion(discussion([]));
  eq(thread.total, 0, "total");
  eq(thread.comments.length, 0, "count");
});

check("carries the discussion url through for the reply link", () => {
  const thread = shapeDiscussion(discussion([]));
  eq(thread.url, "https://github.com/o/r/discussions/1", "url");
});

console.log("\nshapeReactions");

check("drops the groups nobody used", () => {
  // GitHub returns all eight groups every time, most of them at zero.
  const out = shapeReactions([group("THUMBS_UP", 3), group("CONFUSED", 0), group("ROCKET", 0)]);
  eq(out.length, 1, "count");
  eq(out[0]!.icon, "thumbs-up", "icon");
  eq(out[0]!.count, 3, "count");
});

check("orders by count, strongest first", () => {
  const out = shapeReactions([group("EYES", 1), group("HEART", 9), group("ROCKET", 4)]);
  eq(out.map((r) => r.icon).join(" "), "heart rocket eyes", "order");
});

check("maps GitHub's names onto the site's icon set", () => {
  // LAUGH and HOORAY are the two whose icon is not named after them.
  eq(shapeReactions([group("LAUGH", 1)])[0]!.icon, "smile", "laugh");
  eq(shapeReactions([group("HOORAY", 1)])[0]!.icon, "party", "hooray");
});

check("carries a label for the icon", () => {
  const out = shapeReactions([group("HOORAY", 2)]);
  eq(out[0]!.label, "hooray", "label");
});

check("skips a reaction type this code does not know", () => {
  // Future-proofing: an unmapped content value renders nothing rather than
  // an empty chip.
  const out = shapeReactions([group("SOMETHING_NEW", 5), group("HEART", 1)]);
  eq(out.length, 1, "count");
  eq(out[0]!.label, "heart", "survivor");
});

check("is empty for a discussion nobody reacted to", () => {
  eq(shapeReactions([]).length, 0, "count");
  eq(shapeReactions(undefined).length, 0, "undefined");
});

check("hangs reactions off the comment and the discussion", () => {
  const raw = discussion([comment({ reactionGroups: [group("HEART", 2)] })]);
  raw.reactionGroups = [group("ROCKET", 7)];
  const thread = shapeDiscussion(raw);
  eq(thread.reactions[0]!.count, 7, "discussion");
  eq(thread.comments[0]!.reactions[0]!.count, 2, "comment");
});

if (failures > 0) {
  console.error(`\n${failures} failing`);
  process.exit(1);
}
console.log("\nall passing");

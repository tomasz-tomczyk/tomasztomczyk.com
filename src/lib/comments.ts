/**
 * Post comments, read from GitHub Discussions at build time.
 *
 * Repository Discussions are GraphQL-only and GraphQL always wants a token, so
 * there is no way to fetch these from the browser on a static host. They are
 * baked into the HTML instead, which is why a new comment needs a rebuild —
 * `.github/workflows/deploy.yml` triggers one on `discussion_comment`.
 *
 * A missing or rejected token is not a build failure. The site renders with no
 * comments and the reply link still works; a post is readable without them.
 */

import { execFileSync } from "node:child_process";

export type Author = {
  login: string;
  url: string;
  avatarUrl: string | null;
};

/**
 * One reaction total. `icon` is a name in the site's icon set rather than an
 * emoji, so reactions are drawn in the same hand as everything else.
 * Typed as a string, not IconName: importing icons.ts here would pull `?raw`
 * SVG imports into the plain-node test, which cannot resolve them.
 */
export type Reaction = {
  icon: string;
  /** For the accessible name, e.g. "3 reactions: thumbs up". */
  label: string;
  count: number;
};

export type Comment = {
  id: string;
  url: string;
  createdAt: string;
  bodyHTML: string;
  author: Author;
  /** Written by the person whose blog this is, so it gets an "author" badge. */
  isAuthor: boolean;
  reactions: Reaction[];
  replies: Comment[];
};

export type Thread = {
  url: string;
  comments: Comment[];
  /** Reactions on the discussion itself — the post's own, not a comment's. */
  reactions: Reaction[];
  /** Every surviving comment, replies included — what the heading counts. */
  total: number;
};

type RawAuthor = { login: string; url: string; avatarUrl: string | null } | null;

export type RawReactionGroup = {
  content: string;
  reactors: { totalCount: number };
};

type RawComment = {
  reactionGroups: RawReactionGroup[];
  id: string;
  url: string;
  createdAt: string;
  bodyHTML: string;
  isMinimized: boolean;
  author: RawAuthor;
  replies: { nodes: RawComment[] };
};

export type RawDiscussion = {
  number: number;
  url: string;
  reactionGroups: RawReactionGroup[];
  comments: { nodes: RawComment[] };
};

/**
 * GitHub's eight reaction types, mapped onto the site's icons. LAUGH and
 * HOORAY are the two whose icon is not named after them. A type absent from
 * here renders nothing, so a ninth one GitHub adds cannot break the row.
 */
const REACTIONS: Record<string, { icon: string; label: string }> = {
  THUMBS_UP: { icon: "thumbs-up", label: "thumbs up" },
  THUMBS_DOWN: { icon: "thumbs-down", label: "thumbs down" },
  LAUGH: { icon: "smile", label: "laugh" },
  HOORAY: { icon: "party", label: "hooray" },
  CONFUSED: { icon: "confused", label: "confused" },
  HEART: { icon: "heart", label: "heart" },
  ROCKET: { icon: "rocket", label: "rocket" },
  EYES: { icon: "eyes", label: "eyes" },
};

/**
 * Turn a reaction-group list into the ones worth drawing.
 *
 * GitHub returns all eight groups on every object, nearly all at zero, so the
 * filter is what makes this a row of a few chips rather than a keyboard.
 */
export function shapeReactions(groups?: RawReactionGroup[]): Reaction[] {
  return (groups ?? [])
    .filter((group) => group.reactors.totalCount > 0 && REACTIONS[group.content])
    .map((group) => ({ ...REACTIONS[group.content]!, count: group.reactors.totalCount }))
    .sort((a, b) => b.count - a.count);
}

/**
 * The repository the discussions live in. Declared here rather than in
 * consts.ts because this module is also loaded by a plain `node` test, which
 * cannot resolve the `@` path aliases — consts.ts re-exports it as `REPO`.
 */
export const REPO_OWNER = "tomasz-tomczyk";
export const REPO_NAME = "tomasztomczyk.com";
export const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

/** GitHub's stand-in for a deleted account. */
const GHOST: Author = {
  login: "ghost",
  url: "https://github.com/ghost",
  avatarUrl: null,
};

/**
 * Page sizes for the three nested connections.
 *
 * GitHub rejects a query whose connections multiply out past 500,000 possible
 * nodes, and nesting multiplies: these are DISCUSSIONS x COMMENTS x REPLIES,
 * so 100/100/100 is a million and is refused outright. Raising any one of them
 * means lowering another. Past these, a thread is truncated on the site but
 * still whole on GitHub, which the reply link reaches.
 */
const DISCUSSIONS = 100;
const COMMENTS = 50;
const REPLIES = 25;

const QUERY = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    discussions(first: ${DISCUSSIONS}, orderBy: {field: CREATED_AT, direction: DESC}) {
      nodes {
        number
        url
        reactionGroups { content reactors { totalCount } }
        comments(first: ${COMMENTS}) {
          nodes {
            id
            url
            createdAt
            bodyHTML
            isMinimized
            author { login url avatarUrl(size: 80) }
            reactionGroups { content reactors { totalCount } }
            replies(first: ${REPLIES}) {
              nodes {
                id
                url
                createdAt
                bodyHTML
                isMinimized
                author { login url avatarUrl(size: 80) }
                reactionGroups { content reactors { totalCount } }
              }
            }
          }
        }
      }
    }
  }
}`;

function shapeComment(raw: RawComment): Comment {
  return {
    id: raw.id,
    url: raw.url,
    createdAt: raw.createdAt,
    bodyHTML: raw.bodyHTML,
    author: raw.author ?? GHOST,
    isAuthor: raw.author?.login === REPO_OWNER,
    reactions: shapeReactions(raw.reactionGroups),
    replies: (raw.replies?.nodes ?? [])
      .filter((reply) => !reply.isMinimized)
      .map(shapeComment),
  };
}

/**
 * Turn one discussion into a thread.
 *
 * Minimized is how a comment is moderated: hiding it on GitHub takes it off
 * the site at the next build. Hiding a parent takes its replies with it —
 * a reply rendered without the comment it answers reads as a non-sequitur.
 */
export function shapeDiscussion(raw: RawDiscussion): Thread {
  const comments = (raw.comments?.nodes ?? [])
    .filter((comment) => !comment.isMinimized)
    .map(shapeComment);

  const count = (list: Comment[]): number =>
    list.reduce((sum, comment) => sum + 1 + count(comment.replies), 0);

  return {
    url: raw.url,
    comments,
    reactions: shapeReactions(raw.reactionGroups),
    total: count(comments),
  };
}

let pending: Promise<Map<number, Thread>> | undefined;

/**
 * A token for the GraphQL call.
 *
 * CI passes GITHUB_TOKEN in the environment. Locally there is nothing to set
 * up: `gh auth token` is asked for one, so `pnpm dev` shows the same comments
 * the deployed site will. Without either, the site builds with none.
 */
function readToken(): string | undefined {
  // import.meta.env is how a value in .env reaches this module; process.env is
  // how the workflow passes one. Neither exists under the plain-node test.
  const fromEnv =
    import.meta.env?.GITHUB_TOKEN ?? globalThis.process?.env?.GITHUB_TOKEN;
  if (fromEnv) return fromEnv;

  try {
    return execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || undefined;
  } catch {
    return undefined;
  }
}

async function fetchAll(): Promise<Map<number, Thread>> {
  const token = readToken();
  const threads = new Map<number, Thread>();

  if (!token) {
    console.info(
      "[comments] No GITHUB_TOKEN and no `gh auth token` — building without comments.",
    );
    return threads;
  }

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { owner: REPO_OWNER, name: REPO_NAME },
      }),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as {
      data?: { repository?: { discussions: { nodes: RawDiscussion[] } } };
      errors?: { message: string }[];
    };

    // GraphQL reports failures in the body with a 200, so this is the real check.
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((error) => error.message).join("; "));
    }

    for (const raw of payload.data?.repository?.discussions.nodes ?? []) {
      threads.set(raw.number, shapeDiscussion(raw));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[comments] Fetch failed, building without comments: ${message}`);
  }

  return threads;
}

/**
 * The thread for one discussion number, or undefined if the post has none.
 *
 * One request serves the whole build: the promise is memoized at module scope
 * and every page awaits the same one.
 */
export async function getThread(discussion: number): Promise<Thread | undefined> {
  pending ??= fetchAll();
  return (await pending).get(discussion);
}

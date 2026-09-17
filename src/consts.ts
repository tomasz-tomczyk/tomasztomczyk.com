import type { Site, Metadata, Socials, Author } from "@types";

export const SITE: Site = {
  NAME: "Tomasz Tomczyk",
  EMAIL: "me@tomasztomczyk.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 0,
  NUM_PROJECTS_ON_HOMEPAGE: 0,
};

export const HOME: Metadata = {
  TITLE: "Home",
  DESCRIPTION: "Notes and essays on software engineering by Tomasz Tomczyk.",
};

export const POSTS: Metadata = {
  TITLE: "Posts",
  DESCRIPTION:
    "Guides, notes, and things I've learned — on Elixir, DevOps, tooling, and leading teams.",
};

export const ABOUT: Metadata = {
  TITLE: "About",
  DESCRIPTION:
    "Software engineer working on Elixir, DevOps, and engineering leadership. Where I've worked, and how to reach me.",
};

/** Rendered by AuthorCard on every post. Written once, shown everywhere. */
export const AUTHOR: Author = {
  NAME: "Tomasz Tomczyk",
  BIO: "Software engineer. I write about Elixir, DevOps, and the practice of leading teams well.",
  AVATAR: "/tomasz.jpg",
  NOTE: "Written by a human",
};

export const SOCIALS: Socials = [
  {
    NAME: "github",
    HREF: "https://github.com/tomasz-tomczyk",
    HANDLE: "@tomasz-tomczyk",
  },
  {
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/tomczyktomasz",
    HANDLE: "in/tomczyktomasz",
  },
  {
    NAME: "bluesky",
    HREF: "https://bsky.app/profile/tomasztomczyk.bsky.social",
    HANDLE: "@tomasztomczyk.bsky.social",
  },
];

/**
 * The handwritten note pointing at the photo on /about. Keep it short and
 * about the picture — two or three words per line wrap best at this width.
 */
export const ABOUT_NOTE = "Grizzly Creek, Colorado, 2026";

/**
 * The /about sidebar. A snapshot, not a CV — it is meant to go stale, which is
 * why UPDATED sits next to it. Move UPDATED whenever you rewrite ITEMS.
 */
export const CURRENTLY = {
  UPDATED: "September 2026",
  ITEMS: [
    { LABEL: "Work", VALUE: "Staff Engineer at Vetspire — Elixir, Phoenix, GraphQL" },
    { LABEL: "Making", VALUE: "Pressmark, the Astro theme this site runs on" },
    { LABEL: "Writing", VALUE: "Notes on Elixir, DevOps, and running engineering teams" },
    { LABEL: "Place", VALUE: "South London" },
  ],
} as const;

/** How the site is put together. Rendered in the /about colophon. */
export const COLOPHON = [
  { LABEL: "Typography", VALUE: "Crimson Pro · DM Mono · Caveat" },
  { LABEL: "Built with", VALUE: "Astro · Tailwind v4 · Pressmark" },
  { LABEL: "Written in", VALUE: "Markdown, by hand, usually late" },
  { LABEL: "Analytics", VALUE: "Umami — no cookies, nothing personal" },
] as const;

/** Where I've worked. Rendered on /about. */
export const ROLES = [
  {
    ORG: "Vetspire",
    TITLE: "Staff Engineer",
    PERIOD: "2021 — present",
    NOTE: "Previously Head of Engineering. Elixir, Phoenix, and GraphQL at scale, with a team across the US and UK.",
  },
  {
    ORG: "Toyota Connected",
    TITLE: "Senior Software Engineer",
    PERIOD: "2018 — 2021",
    NOTE: "Car-sharing and mobility platforms.",
  },
] as const;

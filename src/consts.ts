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
};

export const SOCIALS: Socials = [
  {
    NAME: "github",
    HREF: "https://github.com/tomasz-tomczyk",
  },
  {
    NAME: "linkedin",
    HREF: "https://www.linkedin.com/in/tomczyktomasz",
  },
  {
    NAME: "bluesky",
    HREF: "https://bsky.app/profile/tomasztomczyk.bsky.social",
  },
];

/**
 * Where I've worked. Rendered on /about.
 *
 * TODO(tomasz): the PERIOD values below are placeholders — I don't have your
 * real dates. Check every one before this goes live.
 */
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

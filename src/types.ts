export type Site = {
  NAME: string;
  EMAIL: string;
  NUM_POSTS_ON_HOMEPAGE: number;
  NUM_WORKS_ON_HOMEPAGE: number;
  NUM_PROJECTS_ON_HOMEPAGE: number;
};

export type Metadata = {
  TITLE: string;
  DESCRIPTION: string;
};

export type Socials = {
  NAME: string;
  HREF: string;
  /**
   * How you're known there — the only part of the row that links out. Written
   * by hand rather than sliced off HREF: handles rarely match the URL path.
   */
  HANDLE: string;
}[];

export type Author = {
  NAME: string;
  BIO: string;
  /** Path under /public, e.g. "/avatar.jpg". */
  AVATAR?: string;
  /**
   * The handwritten aside beside the byline. Shown on every post, so it should
   * be something that doesn't go stale. Omitted, no note is drawn.
   */
  NOTE?: string;
};

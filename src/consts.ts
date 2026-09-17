import type { Site, Metadata, Socials, Author } from "@types";

export const SITE: Site = {
  NAME: "Tomasz Tomczyk",
  EMAIL: "me@tomasztomczyk.com",
  NUM_POSTS_ON_HOMEPAGE: 3,
  NUM_WORKS_ON_HOMEPAGE: 0,
  NUM_PROJECTS_ON_HOMEPAGE: 0,
};

import { REPO_URL } from "@lib/comments";

/** Where the source lives, and where post comments are discussed. */
export { REPO_URL as REPO };

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
    "Staff engineer working on Elixir, DevOps, and engineering leadership. Where I've worked, and how to reach me.",
};

/** Rendered by AuthorCard on every post. Written once, shown everywhere. */
export const AUTHOR: Author = {
  NAME: "Tomasz Tomczyk",
  BIO: "Staff engineer. I write about Elixir, DevOps, and the practice of leading teams well.",
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
export const HOME_NOTE = "And this is Harvey";

export const ABOUT_NOTE = "Grizzly Creek, Colorado, 2026";

/**
 * The /about sidebar. A snapshot, not a CV — it is meant to go stale, which is
 * why UPDATED sits next to it. Move UPDATED whenever you rewrite ITEMS.
 */
export const CURRENTLY = {
  UPDATED: "September 2026",
  ITEMS: [
    { LABEL: "Work", VALUE: "Staff Engineer at Vetspire — Elixir, Phoenix, GraphQL" },
    { LABEL: "Location", VALUE: "South London" },
  ],
} as const;

/** Side projects, listed on /about. An internal HREF is left un-targeted. */
export const PROJECTS = [
  {
    NAME: "Crit",
    HREF: "https://crit.md",
    NOTE: "A local-first review tool for reviewing and iterating on coding-agent output.",
  },
  {
    NAME: "Pressmark",
    HREF: "https://github.com/tomasz-tomczyk/pressmark",
    NOTE: "The Astro theme this site runs on, published as a pair of npm packages.",
  },
  {
    NAME: "This site",
    HREF: REPO_URL,
    NOTE: "Notes on Elixir, DevOps, and running engineering teams. The source is on GitHub.",
  },
] as const;

/**
 * How the site is put together. Rendered in the /about colophon, whose
 * DetailList passes VALUE through `set:html` — inline links are allowed here
 * and nowhere near user input.
 *
 * Typography must name the faces actually loaded: Crimson Pro and IBM Plex
 * Mono come from Pressmark's BaseLayout, Caveat from SiteLayout.
 */
export const COLOPHON = [
  {
    LABEL: "Framework",
    VALUE:
      "<a class=\"link\" href=\"https://astro.build\" target=\"_blank\" rel=\"noopener noreferrer\">Astro</a>",
  },
  {
    LABEL: "Styling",
    VALUE:
      "<a class=\"link\" href=\"https://tailwindcss.com\" target=\"_blank\" rel=\"noopener noreferrer\">Tailwind</a>",
  },
  {
    LABEL: "Theme",
    VALUE:
      "<a class=\"link\" href=\"https://github.com/tomasz-tomczyk/pressmark\" target=\"_blank\" rel=\"noopener noreferrer\">Pressmark</a>",
  },
  { LABEL: "Typography", VALUE: "Crimson Pro · IBM Plex Mono · Caveat" },
  { LABEL: "Illustrations", VALUE: "ChatGPT" },
  {
    LABEL: "Hosting",
    VALUE:
      "<a class=\"link\" href=\"https://pages.github.com\" target=\"_blank\" rel=\"noopener noreferrer\">GitHub Pages</a>",
  },
  {
    LABEL: "Analytics",
    VALUE:
      "<a class=\"link\" href=\"https://umami.is\" target=\"_blank\" rel=\"noopener noreferrer\">Umami</a>",
  },
] as const;

/** Page copy and headings for /cv. */
export const CV: Metadata = {
  TITLE: "CV",
  DESCRIPTION:
    "Tomasz Tomczyk — Engineering Leader. Fifteen years of engineering, the teams, and the work behind them.",
};

/**
 * The CV, verbatim from the source of truth in ../cv/index.html. Change it
 * there first, then mirror it here — the two are meant to read identically.
 */
export const CV_ROLE = "Engineering Leader";
export const CV_LOCATION = "Croydon, United Kingdom";

export const CV_SUMMARY = [
  "I am a pragmatic, product-focused engineer with over 15 years’ experience. I’m comfortable owning ambiguous problems end to end: leading products and teams, making difficult decisions and coordinating incident response when things go wrong. I love growing teams and people in cross-functional, highly autonomous environments while continuously learning and iterating.",
] as const;

/** The second summary paragraph carries a link, so it is rendered by hand. */
export const CV_SUMMARY_PROJECT = {
  BEFORE: "In spare time, I build ",
  LINK: { LABEL: "Crit", HREF: "https://crit.md" },
  AFTER: ", a review tool for iterating on agent output used by engineers daily.",
} as const;

/**
 * Where I've worked, newest first. Grouped by employer, with one POSITIONS
 * entry per role so a promotion keeps its own dates and its own paragraphs.
 * SUMMARY companies are the short, one-line entries under "Earlier".
 */
export const CV_EXPERIENCE = [
  {
    ORG: "Vetspire",
    LOCATION: "Remote",
    POSITIONS: [
      {
        TITLE: "Staff Engineer",
        PERIOD: "May 2024 - Present",
        NOTES: [
          "Solving difficult technical challenges across the organisation: strengthening security across the codebase to enable successful customer audits, reducing DB CPU from ~99% to ~40% and setting the technical direction for the product. Helped retain key accounts by resolving their most critical product issues.",
        ],
      },
      {
        TITLE: "Head of Engineering",
        PERIOD: "September 2021 - August 2024",
        NOTES: [
          "Grew and directly managed the engineering team from 3 to 12, distributed between the US and UK.",
          "Developed and promoted two senior engineers into Tech Lead roles.",
          "Led two reorganisations as the company evolved, steering it towards autonomous, cross-functional product teams.",
          "Advised on architecture, mentored colleagues and remained hands-on for about 50% of my time.",
        ],
      },
      {
        TITLE: "Senior Software Engineer",
        PERIOD: "October 2020 - September 2021",
        NOTES: [
          "Built customer-centric features, working directly with enterprise customers to understand their requirements and iterate on solutions.",
        ],
      },
    ],
  },
  {
    ORG: "Toyota Connected Europe",
    LOCATION: "London, UK",
    POSITIONS: [
      {
        TITLE: "Senior Software Engineer",
        PERIOD: "November 2018 - July 2020",
        NOTES: [
          "Led a team delivering an Elixir-based car-sharing platform for international Toyota markets. Helped shape product direction, owned relationships with clients and partners and represented the technical voice of the team within the wider business.",
          "In the absence of CTO/VPE roles at the company, supported the growth of engineers on the team by conducting regular 1on1s, facilitating feedback and planning professional development. I also led the recruitment process and engineering interviews.",
          "Worked hands-on with Phoenix/Absinthe APIs and managed DevOps, including Kubernetes deployments, CI/CD automation and cloud infrastructure.",
        ],
      },
    ],
  },
  {
    ORG: "uSwitch.com",
    LOCATION: "London, UK",
    POSITIONS: [
      {
        TITLE: "Lead Software Engineer",
        PERIOD: "August 2017 - October 2018",
        NOTES: [
          "Led product delivery and technical direction for a cross-functional team, line-managing three developers, an analyst and a UX designer. Worked hands-on with Elixir, Rails and React.js, delivering new features and A/B tests that grew the team's revenue.",
        ],
      },
      {
        TITLE: "Senior Developer",
        PERIOD: "November 2012 - August 2017",
        NOTES: [
          "Led full-stack and DevOps projects, introduced Elixir to the company and used A/B testing to deliver statistically significant improvements in conversion.",
        ],
      },
    ],
  },
] as const;

export const CV_EARLIER = [
  {
    ORG: "Streaming Tank",
    PERIOD: "August 2012 - October 2012",
    TITLE: "Senior Developer",
    NOTE: "Built a live-commerce SPA and mentored junior developers.",
  },
  {
    ORG: "Cyber-Duck",
    PERIOD: "August 2010 - July 2012",
    TITLE: "Senior Developer",
    NOTE: "Delivered full-stack projects and supported client pitches.",
  },
] as const;

export const CV_PROJECTS = [
  {
    NAME: "Crit",
    HREF: "https://crit.md",
    LABEL: "crit.md",
    PERIOD: "February 2026 - Present",
    NOTE: "A local-first review tool for reviewing and iterating on coding-agent output. It supports browser-based, line-specific feedback across plans, code changes, running applications and HTML artefacts. It has 700+ GitHub stars and is used by engineers at Spotify, Figma, Fastly, Forter, Datadog and more.",
  },
] as const;

export const CV_EDUCATION = {
  SCHOOL: "University of Bedfordshire",
  DETAIL: "Bachelor's degree in Computer Science · First Class · 2007 - 2010",
} as const;

export const CV_SKILLS = [
  "Elixir",
  "Kubernetes",
  "AWS",
  "GCP",
  "Agentic Workflows",
  "React",
  "TypeScript",
  "Ruby",
  "PHP",
] as const;

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

/**
 * Per-post look. Free-form — any hex, any font stack.
 *
 * Pressmark ships one light palette and no dark mode, so a post that wants
 * dark must supply its own values for ALL the colour roles. Setting `surface`
 * without the text roles produces an unreadable page; `assertReadable` in
 * src/lib/postTheme.ts catches that at build time.
 */
const theme = z
  .object({
    surface: z.string().optional(),
    raised: z.string().optional(),
    line: z.string().optional(),
    muted: z.string().optional(),
    ink: z.string().optional(),
    accent: z.string().optional(),

    /* Syntax roles, used only inside code blocks. A post that re-points
       `raised` must re-point these too — assertReadable enforces it. */
    "code-string": z.string().optional(),
    "code-function": z.string().optional(),
    "code-number": z.string().optional(),
    "code-variable": z.string().optional(),

    fontDisplay: z.string().optional(),
    fontBody: z.string().optional(),
    fontMono: z.string().optional(),
    /** Stylesheet href for faces this post needs. Loaded on this page only. */
    fontUrl: z.url().optional(),
  })
  .optional();

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).optional(),

      /** Banner behind the title, reused as the social card image. */
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** Crop anchor for the banner, e.g. "center", "50% 30%", "left bottom". */
      coverPosition: z.string().optional(),

      /**
       * GitHub Discussion number for this post's comments. A post without one
       * renders no comment section at all, so this rolls out a post at a time.
       * A number rather than a path: the /blog -> /posts move would have
       * broken path matching, and a number does not care about URLs.
       */
      discussion: z.number().int().positive().optional(),

      theme,
    }),
});

export const collections = { posts };

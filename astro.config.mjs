import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import pressmarkShiki from "@pressmark/theme/shiki.json";
import {
  rehypePressmarkCodeBlocks,
  remarkPressmarkCodeTitles,
} from "@pressmark/astro/rehype/pressmark-code-blocks";

export default defineConfig({
  site: "https://tomasztomczyk.com",

  // The blog moved to /posts and contact was folded into /about. These keep
  // every previously published URL working — posts have been linked to since
  // 2017, so breaking them isn't on the table.
  redirects: {
    "/blog": "/posts",
    "/blog/[...slug]": "/posts/[...slug]",
    "/contact": "/about",
  },

  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: pressmarkShiki,
    },
    remarkPlugins: [remarkPressmarkCodeTitles],
    rehypePlugins: [rehypePressmarkCodeBlocks],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});

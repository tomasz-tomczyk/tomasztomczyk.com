import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
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

  // Astro 7 defaults to 'jsx', which drops the whitespace between adjacent
  // inline elements. Several separators here — the CV's role/date `·`, its
  // `—` — are their own elements with only source whitespace around them, and
  // render as `Engineer·May 2024` without this.
  compressHTML: true,

  integrations: [mdx(), sitemap()],
  markdown: {
    // Astro 7 renders Markdown with Sätteri by default, which has no remark or
    // rehype stage. The Pressmark code-block plugins below are unified plugins,
    // so the pipeline stays on unified until they are ported.
    processor: unified(),
    shikiConfig: {
      theme: pressmarkShiki,
    },
    remarkPlugins: [remarkPressmarkCodeTitles],
    rehypePlugins: [rehypePressmarkCodeBlocks],
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Vite rejects requests whose Host header it does not recognise, which
      // is what a Tailscale `serve` proxy sends when viewing the dev site from
      // a phone. Scoped to tailnet names — reaching the server still requires
      // being on the tailnet. Dev only; `astro build` never reads this.
      allowedHosts: [".ts.net"],
    },
  },
});

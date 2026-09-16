# tomasztomczyk.com

Personal blog — notes and essays on software engineering.

Built with [Astro](https://astro.build) and the [pressmark](https://github.com/tomasz-tomczyk/pressmark) design system (Crimson Pro + DM Mono, warm paper palette), consumed locally via pnpm workspace from `../pressmark`.

## Development

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # astro check && astro build
pnpm lint         # ESLint
```

> HMR is unreliable for the linked pressmark packages — restart the dev server
> after editing `pressmark.css`, layouts, or adding component exports.

## Structure

- `src/content/blog/` — posts (Markdown/MDX), organized by year
- `src/pages/` — home, blog list, post page
- `src/components/` — blog-specific components (sidebar, post list item)
- `../pressmark/packages/theme` + `../pressmark/packages/astro` — design system

## License

MIT

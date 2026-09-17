# Blog SVG icons

Preview at `/icons/` when running the blog, or open `index.html` locally. See [AGENTS.md](AGENTS.md) for the style brief, original references, design decisions, and maintenance rules.

All icons use a 24 × 24 viewBox and `currentColor`, with no embedded raster images, fonts, scripts, filters, or external resources. Use 16–24px for metadata and tags.

All icons use hand-drawn curves, rounded ink strokes, slight asymmetry, and restrained hatching. Elixir retains its logo silhouette with two inner fold curves. Vetspire and Uswitch have a faint translucent ink wash; backgrounds remain transparent so the blog’s paper colour shows through. Email, GitHub, LinkedIn, and Bluesky use matching hand-drawn outlines in the About page and site footer.

New icons: `elixir.svg`, `ai-assisted-development.svg`, `vetspire.svg`, `toyota.svg`, `uswitch.svg`.
Social icons (metadata in `src/lib/socialIcons.ts`, geometry in these SVGs): `email.svg`, `github.svg`, `linkedin.svg`, `bluesky.svg`.

Utility icons: `calendar.svg` and `clock.svg`, used for post dates and reading times.

## Usage in Astro

Use the reusable inline component for icons:

```astro
---
import Icon from "@components/Icon.astro";
import IconLabel from "@components/IconLabel.astro";
---
<Icon name="elixir" size={20} />
<IconLabel label="Elixir" />
<IconLabel label="Vetspire" />
```

`Icon` accepts `name`, `size` (default `1em`), `class`, and an optional accessible `title`. Icons beside visible labels are decorative by default. `IconLabel` automatically selects icons for recognized tags and company names; other labels render as text. Both inherit the surrounding text colour.

## Design references

- Direction: calm, tactile, warm editorial design inspired by Moleskine, MUJI, iA Writer, Bear, Japanese stationery, Scandinavian interiors, independent magazines, and personal notebooks. Cream paper, charcoal ink, and restrained orange accents.
- Elixir: https://elixir-lang.org/ — approved hand-drawn interpretation of the supplied logo SVG, with two inner fold curves.
- AI-assisted development: original robot glyph with code brackets.
- Vetspire: https://www.vetspire.ai/ — hand-drawn interpretation of the geometric V symbol from the site header.
- Toyota: https://global.toyota/en/mobility/toyota-brand/emblem/ — hand-drawn three-oval emblem.
- Uswitch: https://www.uswitch.com/ — hand-drawn square U symbol from the site header.

Company and language glyphs are blog-sized monochrome interpretations, not official brand asset downloads.

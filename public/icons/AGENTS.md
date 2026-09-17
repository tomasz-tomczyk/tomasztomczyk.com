# Blog icon library

Keep this directory as the permanent SVG asset library and `/icons/` preview. Keep `index.html`, `README.md`, and these instructions alongside the SVGs. Update the preview when an icon changes.

## Design direction and original references

The design brief describes a thoughtfully maintained personal notebook belonging to a programmer, writer, and designer who values craftsmanship, clarity, calm tools, and timeless utility.

Preserve these references from that brief:

- Moleskine and MUJI: plain materials, useful details, quiet craftsmanship.
- iA Writer and Bear: writing comes first; interface details stay unobtrusive.
- Japanese stationery culture and Japanese utility aesthetics.
- Scandinavian interiors, reading nooks, and oak/walnut warmth.
- Independent editorial magazines and personal notebooks.
- Everyday carry simplicity, without tactical or military styling.

Material references: cream paper, graphite, matte black, walnut, oak, felt, linen, subtle grain, notebook paper, soft shadows, and occasional brushed metal accents. These describe the site's mood; icons do not need to depict all of them.

Use warm off-white paper, charcoal ink, muted warm greys and beige, with a single bright orange accent used sparingly. The surrounding site supplies the paper and colour. Icons remain transparent and inherit their ink colour.

Avoid glossy SaaS styling, startup gradients, glassmorphism, neon/cyberpunk treatments, tactical ruggedness, sterile pure-white minimalism, loud animation, and marketing hero decoration. Keep the icons personal, understated, and quietly technical.

## How we arrived at the current set

1. The first set used crisp monochrome filled glyphs to match the site's existing social icons.
2. The user asked for a more hand-drawn, paper-like feel. The five new subject/company icons became slightly uneven ink outlines with rounded strokes, restrained hatching, and occasional faint washes.
3. The initial Elixir drawing and a rounder raindrop alternative did not capture the real mark closely enough. The user supplied `~/Downloads/elixir.svg` as a reference. That local file informed the logo's asymmetric silhouette and overlapping folds; it is not a runtime dependency.
4. A closer logo sketch introduced too many internal lines. The user asked to keep only one or two. The approved `elixir.svg` retains two inner fold curves, the recognizable outer silhouette, and one faint wash. Extra contours, cross-hatching, and the earlier variants were removed.
5. The approved icons were connected to a reusable inline component and placed beside matching tags and company mentions.
6. The user then asked to redraw and swap the social icons too. Email, GitHub, LinkedIn, and Bluesky now share the hand-drawn outline style, and About and the site footer render them through the same inline component.

Keep the approved Elixir design as the sole Elixir asset. Do not restore the generic raindrop variants or add extra inner detail without a new request. Brand recognition and a clear silhouette matter more than decorative sketching.

## Drawing rules

- Draw real SVG paths; do not embed raster images.
- Use a `0 0 24 24` viewBox and `currentColor` for paint.
- Keep backgrounds transparent. Let the page provide the paper texture.
- Use gently asymmetric curves and slightly imperfect edges, rather than random jitter or exaggerated wobble.
- Prefer rounded line caps and joins. Main contours are approximately 1.3–1.5 units at the 24-unit scale; internal curves can be lighter. Elixir's transformed paths produce approximately 1.35-unit outlines and 0.8–0.9-unit inner lines.
- Use restrained translucent ink washes, usually around 6–9% opacity. Avoid gradients, SVG texture filters, heavy shadows, and dense detail.
- Elixir has exactly two inner curves and no hatching. Other icons may use a few short hatch marks where they help the hand-drawn character.
- Check at 16, 20, and 24 pixels as well as a larger size. A pleasing large drawing can become illegible in metadata.
- Keep company marks recognizable: Vetspire's faceted V, Toyota's three ovals, and Uswitch's square U. These are monochrome blog interpretations, not official brand artwork.
- The AI development mark is an original small robot with code brackets.
- Calendar and clock use lightly uneven outlines and minimal inner marks. They appear at 13px in post bylines, so avoid fine hatching or extra ticks.
- Social icons use the same hand-drawn ink style: an envelope for Email, an Octocat silhouette for GitHub, a square with `in` for LinkedIn, and a butterfly for Bluesky. Keep their distinctive shapes recognizable at small sizes. Their geometry lives in the SVGs here; `src/lib/socialIcons.ts` holds only labels and icon names.

## Source references

- [Elixir](https://elixir-lang.org/) and the user-supplied SVG described above.
- [Vetspire](https://www.vetspire.ai/): header's geometric V symbol.
- [Toyota emblem](https://global.toyota/en/mobility/toyota-brand/emblem/): three overlapping ovals.
- [Uswitch](https://www.uswitch.com/): header's square U symbol.

## Integration and maintenance

- `src/components/Icon.astro` renders an inline SVG. It accepts `name`, `size`, `class`, and optional accessible `title`; its default size is `1em`.
- `src/components/IconLabel.astro` selects the icon for a recognized tag/company label and supports an optional text prefix and custom size. Unknown labels remain text.
- `src/lib/icons.ts` imports all approved SVG sources and preserves their paint settings. Add new component icons and label aliases there.
- Keep SVG geometry in the files here as the source of truth. Do not copy paths into page templates.
- Decorative icons beside text are hidden from screen readers. Give standalone meaningful icons an accessible title.
- Icons inherit surrounding text colour, including link hover colours and article-specific palettes. Avoid hardcoded charcoal or orange in the SVG assets.
- The current pages are Home, About, CV, tag index/detail, and post bylines. There is no separate `/work` route; work mentions currently live on About and CV.
- Keep light/dark and ink/orange preview controls, download links, and 16/20/24px examples on `/icons/`.
- After integration changes, run `pnpm build` and lint the edited files. Check generated HTML contains inline SVGs beside the intended labels and no obsolete Elixir variants.

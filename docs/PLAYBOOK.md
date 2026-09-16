# Pressmark migration playbook

Working notes for tomasztomczyk.com + Pressmark. Written at the end of the
first migration session so the next one can pick up cold.

**Repos.** `~/Server/side/tomasztomczyk.com` (branch `pressmark-migration`) and
`~/Server/side/pressmark` (`main`, released as v0.5.0).

**Two Pressmark modes.** `package.json` states the published range (`^0.5.0`)
and the lockfile matches, so a fresh clone and the Pages deploy need nothing
special. To develop against the sibling checkout:

    pnpm pressmark:local   # build against ../pressmark, edits are live
    pnpm pressmark:npm     # back to the published packages

It is a `node_modules` symlink swap, not a resolution change — deliberately.
A `.pnpmfile` hook or a committed override makes the lockfile differ per mode,
and whichever you ran last is the one you commit. Clear `.astro` and
`node_modules/.vite` after switching.

`pressmark:npm` re-points at `node_modules/.pnpm` rather than reinstalling:
pnpm decides `install` has nothing to do by comparing the lockfile against its
own state and never inspects `node_modules`, so it will not repair a link you
replaced — not even with `--force`.

**Both repos are committed and pushed.** Pressmark shipped as v0.5.0 (theme and
astro on npm, published by the release Action with OIDC provenance). The site is
on `pressmark-migration`; the Pages deploy only runs on `main`, so merging is
what ships it.

---

## 1. The decision that shaped everything

The starting question was whether to keep building Pressmark as a reusable theme
or make the blog a one-off with per-article styling.

Answer: **keep Pressmark**, because the mockups were never "no theme". Every one
shared the same nav, meta line, header block, numbered list, code block, pull
quote and footer. Only four things varied: surface, accent, display face, and
hero artwork. That's a theme with a variant axis, not the absence of one.

The follow-on decisions, in the order they were made:

| Question | Decision |
|---|---|
| How do Pressmark's non-negotiables survive per-post theming? | Split **structure from skin**. Components stop hardcoding hexes and read role tokens. |
| What is the posts section called? | `/posts`. Redirects from `/blog/*`. |
| How does a post declare its look? | **Free-form tokens** in frontmatter. No presets, no allowlist. |
| Sidebar or top nav? | Pressmark gains a `Topbar` shell **alongside** `Sidebar`, not replacing it. |
| Which mockup decoration is real? | **Hero image + author card only.** No handwritten marginalia, no related-post thumbnails. |
| Likes / comments? | Out of scope. Site stays static. |
| Dark mode in Pressmark? | **No — and it stays no.** Pressmark ships one light palette. The site defines its own dark values per post. |
| Backwards compatibility in Pressmark? | None. Sole consumer. Clean rename, no shims. |

### The key insight, worth not losing

Because components read roles rather than hexes, **almost none of Pressmark's
non-negotiables needed revoking.** They became rules about what Pressmark
*ships*, not what a consumer *can do*:

- "Exactly six colours" — still true. Six role tokens, one set of values.
- "Fonts, two only" — still true. Three tokens (`display`/`body`/`mono`), two faces.
- "Dark mode isn't implemented" — **unchanged and enforced.** See below.
- "No gradients" — one narrow exception, added late. See §5.

Pressmark 0.4.0 is not "Pressmark gets theming". It's "Pressmark stops
hardcoding its own look".

---

## 2. What Pressmark 0.4.0 contains

Breaking, no compatibility aliases. `packages/theme` and `packages/astro` both
bumped to 0.4.0. The demo was migrated in the same change.

**Role-token rename** (pure rename, no colour values changed):

| ≤ 0.3 | 0.4 | role |
|---|---|---|
| `paper` | `surface` | page background |
| `warm-white` | `raised` | cards, badges, code bg |
| `stone` | `line` | dividers, hairlines |
| `warm-gray` | `muted` | tiny mono captions only |
| `charcoal` | `ink` | primary text |
| `accent` | `accent` | unchanged |
| `--shadow-paper` | `--shadow-soft` | it's a shadow, not a colour |

Covers both custom properties (`--color-paper` → `--color-surface`) and the
Tailwind classes built from them (`bg-paper` → `bg-surface`).

**Also added:**

- `--font-display` split from `--font-body` (both still Crimson Pro). Prose
  `h2`/`h3` state the display face explicitly rather than inheriting.
- `Topbar` layout — horizontal shell beside `Sidebar`.
- `src/lib/nav.ts` — shared `withBase` / `normalizePath` / `isActive` so the two
  shells can't drift. `isActive` matches section descendants (`/posts` stays
  current on `/posts/foo`), with `/` exempt.
- `Hero` — `variant="figure" | "banner"`, `scrimStyle="flat" | "panel" | "gradient"`.
- `AuthorCard` — rail and inline variants, lettered avatar placeholder,
  `iconStyle: "fill" | "stroke"` for brand glyphs.
- `BaseLayout` gained `htmlAttrs` and `bodyClass` — the escape hatch that lets a
  consumer re-point roles on `<html>`.
- `.dek` utility — the standfirst under a title, 26px/300.
- Shiki colour mapping in `rehypePressmarkCodeBlocks` (see §4).

---

## 3. How per-post theming works

`src/lib/postTheme.ts` in the site. Free-form: any hex, any font stack.

```yaml
---
title: "…"
theme:
  surface: "#14161A"
  raised:  "#1C1F24"
  line:    "#2A2E35"
  muted:   "#8B9199"
  ink:     "#E8E6E1"
  accent:  "#4A9EFF"
---
```

Resolved into an inline `style` on `<html>`, so the nav and footer theme with the
article. A post's look is **pinned** — no `prefers-color-scheme`, no reader
switching. `color-scheme` is derived automatically from surface luminance so
scrollbars and form controls match.

### The guard — read this before touching the thresholds

Free-form means a typo ships an unreadable page. `assertReadable` runs at build
time and **fails `astro build`**:

```
Unreadable theme in src/content/posts/2025/enforcing-max-query-depth-with-absinthe:
  ink #1F1F1F on surface #14161A = 1.10:1, needs 4.5:1
```

Floors are `ink 4.5`, `accent 3.0`, `muted 2.0` — deliberately **not WCAG AA**.
Pressmark's own palette is knowingly below AA (`muted` 2.24:1, `accent` 3.37:1);
holding it to AA would fail the house style on every page. The job is to catch
the failure free-form theming actually produces: re-pointing the surface and
forgetting a text role, landing near 1:1.

`npm test` runs 20 tests over this (`src/lib/postTheme.test.ts`, native Node TS
stripping, no test framework). Run it after any threshold change.

Useful fact discovered here: the mockups' blue `#4a9eff` is **2.5:1 on cream** —
the guard rejects it on a light surface. It only works on dark, which is where
it was drawn.

---

## 4. Non-obvious things that will bite

**Code colour is set by `shiki.json`, not by the highlighter.** Shiki is the
strongest option there is (real TextMate grammars, VS Code themes; Prism and
highlight.js are regex-based and less accurate) — if code looks flat, the theme
is flat. It was: strings, functions, variables, numbers and punctuation all
resolved to `#1F1F1F`, so a real post rendered 618 tokens in three colours.
0.5.0 added three code-only roles (`code-string`, `code-function`,
`code-number`); the same post now renders in seven. Count them in `dist` rather
than judging by eye:
`grep -o 'color:[^;"]*' dist/posts/<slug>/index.html | sort | uniq -c`.

**Shiki bakes colours at build time.** It resolves its theme to literal hexes in
inline `style` attributes, which made highlighted code the one element immune to
a re-pointed role — dark article, cream code block. Fixed by mapping those hexes
back to `var(--color-*)` in `rehypePressmarkCodeBlocks` via
`PRESSMARK_SHIKI_TOKEN_MAP`. **Editing `shiki.json` means updating that map**, or
code blocks silently stop theming. Shiki 4 removed the `css-variables` theme, and
a light/dark theme pair would only give two code palettes rather than one per
post — mapping to roles handles any palette.

**A stale dev server will make you re-do finished work.** A screenshot from a
dev server started before a Pressmark edit shows the OLD render — three colours
where the build has seven — and looks exactly like the change never landed.
Confirm which you are looking at before judging: count the colours in the served
HTML (`curl`-free: fetch it and count `style="color:`) and compare with `dist`.

**The dev server and the browser both cache aggressively.** Two separate
rabbit-holes this session, both self-inflicted:
- Playwright served a stale page while I concluded dev and build disagreed. They
  never did. Always cache-bust with a query string (`?v=2`) before judging a
  change.
- After editing anything in Pressmark, `rm -rf .astro node_modules/.vite` and
  restart, or the markdown pipeline serves cached renders.

**`sd` is in the global CLAUDE.md but is not installed.** Use `python3` for
edits, **not `perl -pi -e`** — plain `perl -pi` reads and writes bytes, so any
line it rewrites that contains a non-ASCII character comes back mojibake. It
silently turned the footer's `←` into `â`, and the "Wide character in print"
warning was the only hint. If you must use perl, pass `-CSD`.

**Bash `cd` persists across a compound command** but the harness resets cwd
afterwards, so `cd pressmark && npm test` silently runs in the wrong repo. Check
`pwd` when results look odd.

**Capture-group escaping through a bash heredoc.** A `perl` rename with `$1`
written as `\\\$1` produced the literal string `$1` in 268 places and destroyed
the prefix information. Write the script to a `.pl` file instead of embedding it.
Always run a rename against a clean tree so `git checkout -- .` is a free undo.

---

## 5. The gradient exception

Pressmark banned gradients outright. The `Hero` banner needs the overlaid title
to be legible over arbitrary photography, and a flat wash dims the whole picture
including the parts with no text on them.

After comparing flat / solid panel / gradient side by side, the gradient won and
the rule got **one narrow exception**, documented in Pressmark's `CLAUDE.md`:
permitted only as a legibility scrim behind text over media, never decorative,
never to manufacture hierarchy. `flat` remains the default so nothing picks it up
by accident.

**Two bugs to not repeat** (both cost a round trip):
1. The stops cleared at 88% width, but the header is a **centred** 46rem column
   ending near 67%. Tuned for left-aligned text like the mockup; the visible area
   never cleared.
2. A fixed gradient under a second `opacity` scales the layer uniformly and turns
   it straight back into a flat wash — and made the text side darker than flat
   while barely brightening the far side.

Fix: compute the stops from `scrim` in the component, no stacked opacity, clear
by 72%. `scrim` now means "strength behind the text"; the far side always reaches
fully clear.

---

## 6. Site structure now

- Nav: `/TT` wordmark left, links centred via `grid-cols-[1fr_auto_1fr]`.
  Active = dotted underline in ink (accent stole attention). Hover = accent +
  solid underline, never a background pill. `hover:decoration-solid` is needed so
  hovering the active link visibly changes.
- Posts have **no rail**. It was `fixed`, but the article reserved space for it
  with `xl:mr-[340px]`, so the reading column sat off-centre against a nav that
  is centred on the viewport. Every page now shares one centred `46rem` column.
- Byline: a horizontal `AuthorCard variant="inline"` directly under the hero,
  rules above and below, with the date and read time on its right. Always
  present, at every width, and the only place they appear above the article.
  The `inline` variant puts the eyebrow on the same line as the name in the same
  display face ("Written by Tomasz Tomczyk"); `rail` still stacks them.
- ToC: a `sticky top-20` nav inside an `absolute inset-y-0 right-6` column,
  which lives in a `relative` wrapper around **everything below the hero**.
  Absolute means it reserves no width, so the article stays centred on the
  viewport; the wrapper's bounds mean the ToC starts where the hero ends and
  stops at the foot of the article, rather than sitting over the artwork.
  `bg-surface/90` only, no border — with the hero overlap gone the panel has
  nothing left to fence off, and a boxed ToC read as a widget.
  - Width is capped by `wide-media`, whose figures break out to 54rem: the
    usable gutter is `(vw - 864)/2` less the 24px right margin. Hence two steps
    rather than one width — `w-60` from 1440, `w-72` from 1536, each landing
    24px clear of a breakout figure. Widen one and the breakpoint must move too.
  - The panel is not decoration — a fixed ToC sits over the banner hero and
    over `wide-media` figures, and was unreadable without it.
  - Breakpoint is `min-[1400px]`, not `xl`. `wide-media` runs to ~54rem, so at
    1280 the images ran under the ToC. 1400 is the width where a `w-56` panel at
    `right-6` clears them.
- Type scale: h1 48px → `.dek` 26px → body 21px → UI 18px → meta 13px.
  A subtitle uses `.dek`, never `text-lg` (18px is the UI size and sits *below*
  the reading size — that inversion was a live bug).
- Redirects: `/blog` → `/posts`, `/blog/[...slug]` → `/posts/[...slug]`,
  `/contact` → `/about`.
- Tags: `/tags` (index, busiest first) and `/tags/[tag]`, both built from
  `src/lib/tags.ts` so they cannot disagree about what exists. Tag pages reuse
  `PostListItem`, so they read like `/posts`. Linked from the post badges and
  the `/posts` header — deliberately **not** in the nav, which is fine at three
  items.
  - Tags stay **free-form**, matching the choice made for themes — no allowlist
    in `consts.ts`. `tagSlug` lowercases and hyphenates; `assertNoTagCollisions`
    fails the build when two spellings land on one URL (`CI/CD` + `ci-cd` →
    `/tags/ci-cd`). It catches collisions, **not typos** — `elixr` is a
    legitimate new tag as far as the build can tell.
  - Drafts contribute no tags, so a draft-only tag has no page until it ships.
  - **Two tags only**, deliberately: `elixir` (4) and `ai-assisted-development`
    (3), covering all six published posts. A first pass at 12 tags left ten of
    them with a single post each — a tag page listing one post is worse than no
    tag page, and three long chips made the byline block tall enough to push
    the article down. Add a third only when a third subject has two posts in it.
    The incidents draft is currently untagged for that reason.
  - **Lists carry rules only between rows, never around the outside.** No
    `border-t` on the `<ul>`, and `last:border-b-0` on the item. On `/posts` the
    top border was a visible double hairline against the year line's own rule;
    everywhere else it is consistency. Applies to `/posts`, `/tags`,
    `/tags/[tag]` and the home page.
  - `/tags` and `/posts` carry no `PanelLabel` — it restated the h1 below it.
    `/tags/[tag]` keeps one, because there it reads `TAG / 4 POSTS` above an h1
    of `#elixir`: a type label and the count, not a restatement.
  - Tag chips use `Badge variant="meta"` (`badge-meta`, added in Pressmark
    0.5.0): the default badge is 18px serif and towered over the 13px mono date
    beside it. `badge-meta` inherits its colour, so the wrapping link supplies
    both the meta grey and the accent hover.

---

## 7. Open items

1. **Invented CV dates.** `ROLES` in `src/consts.ts` has placeholder `PERIOD`
   values I guessed from homepage copy. Marked `TODO(tomasz)`. Fix before live.
2. **The Absinthe post's dark theme is a demo.** Delete the `theme:` block in its
   frontmatter to revert. Decide whether it keeps it.
3. **Avatar.** `AUTHOR.AVATAR` is unset, so `AuthorCard` draws a lettered
   placeholder. Drop an image in `public/` and set it.
3b. **The syntax hexes: tune in OKLCH, not by eye.** The first pass looked
   monotone and measuring said why — chroma 0.062-0.096 against the accent's
   0.179, three roles at near-identical lightness (0.433/0.456/0.458), and
   `code-number` only 17 deg off the accent's hue. Contrast floors were being
   over-satisfied (5.7-6.9:1 against a 3.0 floor), and the headroom had been
   spent on darkness instead of colour. Current set is chroma 0.129-0.141 with
   65 deg as the smallest hue gap between any two roles. Check a candidate with
   OKLCH lightness/chroma/hue, not a hex diff: two colours can differ in hex
   and be indistinguishable on screen.

3c. **Elixir's grammar gives plain locals no scope at all.** `res`, `depth`,
   `selections` in a function body come through as bare `source.elixir` — there
   is nothing for any theme to target, mine or github-light or catppuccin.
   Parameters ARE reachable via `meta.function` (that is what `code-variable`
   colours), and `constant.other.keywords` (`do:`) was sitting unstyled. Before
   concluding "the highlighter is weak", dump the scopes:
   `hl.codeToTokens(src, { lang, theme, includeExplanation: true })` and print
   the leaf scope per token. Unused args showing as muted italic is not a bug —
   the grammar scopes them `comment.unused.elixir`.

3d. **A post's code roles must separate from that post's accent.** The Absinthe
   post takes a blue accent, so its `code-number` is amber rather than the
   shipped blue — two blues in one block read as one colour. The build guard
   checks contrast, not hue collision; that one is still on you.
4. **Pre-existing dev-only bug**, not from this work: `/@vite/client` 500s with
   `Failed to resolve import "@vite/env"`. Present before any of these changes,
   survives a cache clear, affects HMR only — builds and pages are fine. Likely
   the pnpm/bun split across the two repos' `node_modules`.
5. **`scrimStyle="panel"`** is built and works but unused. It needs no gradient
   exception and suits artwork with a calm left third. Keep or drop.
6. **Astro 6.3.3 → 7.3.2** available. Not urgent mid-migration.
7. **Publishing Pressmark 0.4.0.** Breaking change on a public npm package;
   `README.md` carries the rename table. Note it in the release.

---

## 8. How we worked

What was worth doing, for repeating:

- **Question the premise before building.** The first substantive move was
  noticing the mockups were a theme, not its absence. That reframed the whole
  job and saved building the wrong thing.
- **Surface rule conflicts instead of routing around them.** Pressmark's
  non-negotiables contradicted the mockups on every point. Naming that and
  asking was faster than silently picking a side — and the answer ("split
  structure from skin") turned out to preserve nearly all the rules.
- **Decisions were asked one at a time, with a recommendation.** Several went
  against the recommendation (free-form over bounded presets; no dark mode in
  Pressmark). Those were taken as given and engineered around rather than
  re-argued — free-form got the build-time guard instead of an allowlist.
- **Verify by measuring, not by looking.** Computed styles and pixel values
  settled the hover states, the type inversion and the exclusivity of the
  date line. Eyeballing a screenshot produced two wrong conclusions this session.
- **Write the invariant down where it will be read.** Every non-obvious
  constraint discovered here went into Pressmark's `CLAUDE.md` next to the rule
  it qualifies — the Shiki map, the type scale, the gradient exception, the
  stacked-opacity trap.

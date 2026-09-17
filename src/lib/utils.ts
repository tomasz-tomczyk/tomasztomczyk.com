export function formatDate(
  date: Date,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
) {
  return Intl.DateTimeFormat("en-US", opts).format(date);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = ((wordCount / 200) + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

/**
 * Turn a free-form frontmatter tag into a URL segment.
 *
 * Tags are authored as plain text with no allowlist, so anything that isn't a
 * letter or digit becomes a hyphen.
 *
 * Throws rather than returning "" for a tag with nothing slug-able, so the
 * failure surfaces at build time instead of producing the route `/tags/`.
 */
export function tagSlug(tag: string): string {
  const slug = tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error(
      `Tag "${tag}" has no letters or digits, so it cannot become a URL. ` +
        `Rename it in the post's frontmatter.`,
    );
  }
  return slug;
}

/**
 * Throw if two DIFFERENT tags would share a slug.
 *
 * Free-form tags mean `CI/CD` and `ci-cd` both resolve to `ci-cd`: one page
 * silently serving two tags, and a duplicate route from `getStaticPaths`.
 * The same tag repeated across posts is the normal case and passes.
 *
 * Called from the tag routes, so a clash fails `astro build` rather than
 * shipping. It catches collisions, not typos.
 */
export function assertNoTagCollisions(tags: string[]): void {
  const bySlug = new Map<string, Set<string>>();
  for (const tag of tags) {
    const slug = tagSlug(tag);
    (bySlug.get(slug) ?? bySlug.set(slug, new Set()).get(slug)!).add(tag);
  }

  const clashes = [...bySlug].filter(([, spellings]) => spellings.size > 1);
  if (clashes.length) {
    throw new Error(
      `Tags collide on the same URL:\n` +
        clashes
          .map(([slug, spellings]) => `  /tags/${slug} ← ${[...spellings].join(", ")}`)
          .join("\n") +
        `\nPick one spelling per tag in the posts' frontmatter.`,
    );
  }
}

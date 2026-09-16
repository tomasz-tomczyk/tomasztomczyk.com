import { type CollectionEntry, getCollection } from "astro:content";
import { assertNoTagCollisions, tagSlug } from "@lib/utils";

export type Tag = {
  /** The tag as written in frontmatter — what the reader sees. */
  name: string;
  /** Its URL segment. */
  slug: string;
  posts: CollectionEntry<"posts">[];
};

/**
 * Every tag across published posts, newest posts first within each.
 *
 * Shared by both tag routes so the index and the individual pages can't
 * disagree about what exists. Drafts are excluded here rather than at each
 * call site — a draft's tags should not create a page.
 */
export async function getTags(): Promise<Tag[]> {
  const posts = (await getCollection("posts"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  // Fails the build when two spellings would share a URL.
  assertNoTagCollisions(posts.flatMap((post) => post.data.tags ?? []));

  const bySlug = new Map<string, Tag>();
  for (const post of posts) {
    for (const name of post.data.tags ?? []) {
      const slug = tagSlug(name);
      const tag = bySlug.get(slug) ?? { name, slug, posts: [] };
      tag.posts.push(post);
      bySlug.set(slug, tag);
    }
  }

  // Busiest first, then alphabetical — a tag with one post is the least
  // useful thing on the page, so it sinks.
  return [...bySlug.values()].sort(
    (a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name),
  );
}

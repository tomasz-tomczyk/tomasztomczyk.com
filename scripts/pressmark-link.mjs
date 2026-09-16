/**
 * Swap Pressmark between the published package and the working copy next door.
 *
 * package.json always states the real published range (`^0.5.0`), and the
 * lockfile always matches it — so a fresh clone, CI and the Pages deploy need
 * nothing special. Local development is a `node_modules` symlink swap and
 * nothing more: it never touches package.json or pnpm-lock.yaml, so the two
 * modes cannot drift and there is no lockfile to accidentally commit.
 *
 *   pnpm pressmark:local   → build against ../pressmark, edits are live
 *   pnpm pressmark:npm     → back to the published packages
 */
import { existsSync, lstatSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["astro", "theme"];
const mode = process.argv[2];

/** The version range package.json asks for, as a bare version for store lookup. */
function pkgVersions() {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const out = {};
  for (const p of PACKAGES) {
    out[p] = (manifest.dependencies[`@pressmark/${p}`] ?? "").replace(/^[^0-9]*/, "");
  }
  return out;
}

/** Locate a package inside node_modules/.pnpm, whose dir names carry peer hashes. */
function storePath(name, version) {
  const store = join(root, "node_modules", ".pnpm");
  if (!existsSync(store)) return null;
  const prefix = `@pressmark+${name}@${version}`;
  for (const entry of readdirSync(store)) {
    if (!entry.startsWith(prefix)) continue;
    const candidate = join(store, entry, "node_modules", "@pressmark", name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const linkPath = (p) => join(root, "node_modules", "@pressmark", p);
const sourcePath = (p) => resolve(root, "..", "pressmark", "packages", p);

if (mode === "local") {
  const missing = PACKAGES.filter((p) => !existsSync(sourcePath(p)));
  if (missing.length) {
    console.error(
      `Cannot link: ${missing.map(sourcePath).join(", ")} not found.\n` +
        `Clone pressmark next to this repo, or stay on the published packages.`,
    );
    process.exit(1);
  }
  for (const p of PACKAGES) {
    const link = linkPath(p);
    if (existsSync(link) || lstatSync(link, { throwIfNoEntry: false }))
      rmSync(link, { recursive: true, force: true });
    symlinkSync(sourcePath(p), link, "dir");
    console.log(`@pressmark/${p} → ${sourcePath(p)}`);
  }
  console.log("\nLocal Pressmark. Restart the dev server and clear caches:");
  console.log("  rm -rf .astro node_modules/.vite && pnpm dev");
} else if (mode === "npm") {
  /**
   * Re-point at the pnpm store rather than reinstalling. `pnpm install` decides
   * it has nothing to do by comparing the LOCKFILE against its own state — it
   * does not look at what is actually in node_modules — so it will not repair a
   * link we replaced, even with --force. The store entry is untouched, so the
   * honest fix is to point the link back at it.
   */
  const wanted = pkgVersions();
  for (const p of PACKAGES) {
    const target = storePath(p, wanted[p]);
    if (!target) {
      console.error(
        `@pressmark/${p}@${wanted[p]} is not in node_modules/.pnpm.\n` +
          `Run: rm -rf node_modules && pnpm install`,
      );
      process.exit(1);
    }
    rmSync(linkPath(p), { recursive: true, force: true });
    symlinkSync(target, linkPath(p), "dir");
    console.log(`@pressmark/${p} → ${wanted[p]} (published)`);
  }
  console.log("\nPublished Pressmark restored. Clear caches before building:");
  console.log("  rm -rf .astro node_modules/.vite");
} else {
  console.error("usage: node scripts/pressmark-link.mjs local|npm");
  process.exit(1);
}

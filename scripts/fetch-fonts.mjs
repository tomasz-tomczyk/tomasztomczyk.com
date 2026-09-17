/**
 * Re-download the self-hosted copy of Caveat and print its @font-face rules.
 *
 * Only the subsets listed in `wanted` are kept. The rules it prints must be
 * pasted into src/styles/global.css — the unicode-ranges come from Google and
 * change with the font, and a stale range silently stops matching characters
 * the file still contains.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "fonts");
mkdirSync(OUT, { recursive: true });

// Chrome UA, otherwise Google serves ttf instead of woff2.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

const css = await (
  await fetch(
    "https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=swap",
    { headers: { "User-Agent": UA } },
  )
).text();

// Each @font-face block carries its subset name in a preceding comment.
const blocks = css.split("/*").slice(1);
const wanted = new Set(["latin", "latin-ext"]);
const faces = [];

for (const block of blocks) {
  const subset = block.slice(0, block.indexOf("*/")).trim();
  if (!wanted.has(subset)) continue;
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  const range = block.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim();
  if (!url) continue;

  const buf = Buffer.from(
    await (await fetch(url, { headers: { "User-Agent": UA } })).arrayBuffer(),
  );
  const file = `caveat-500-${subset}.woff2`;
  writeFileSync(`${OUT}/${file}`, buf);
  faces.push({ subset, file, range, bytes: buf.length });
  console.log(`${file.padEnd(28)} ${(buf.length / 1024).toFixed(1)}KB`);
}

console.log("\n--- css ---");
for (const f of faces) {
  console.log(`@font-face {
  font-family: "Caveat";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/${f.file}") format("woff2");
  unicode-range: ${f.range};
}`);
}

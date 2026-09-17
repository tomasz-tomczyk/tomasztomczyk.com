/**
 * The one way to serve this site locally.
 *
 *   pnpm dev            → http://localhost:4321, reachable on the LAN
 *   pnpm dev --fresh    → the same, after throwing the caches away
 *   pnpm preview        → http://localhost:4322, serving dist/
 *
 * Two things this does that `astro dev` does not:
 *
 * 1. Holds the port. Astro's own behaviour when its port is taken is to move
 *    to the next one and carry on, which means a forgotten server is invisible
 *    — you get a working site at a URL you did not ask for and the old one
 *    keeps running. Stacking those is how this repo ended up with 37 of them.
 *    Here the port is the identity of the server: whatever holds it is killed
 *    first, so there is only ever one, always at the same address. dev and
 *    preview take different ports so they can run side by side.
 *
 * 2. Clears the caches when Pressmark has been swapped underneath them.
 *    `.astro` and Vite's cache both key off the old copy, so the server keeps
 *    serving the previous markdown render and CSS and a correct change looks
 *    like it did nothing. The symlink's target is recorded on each start and
 *    compared on the next one. Preview reads dist/ and so skips all of this —
 *    what makes its output stale is forgetting to build.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MODE = process.argv.includes("preview") ? "preview" : "dev";
const PORT = Number(process.env.PORT ?? (MODE === "preview" ? 4322 : 4321));
const CACHES = [".astro", "node_modules/.vite"];
const STAMP = join(root, "node_modules", ".cache", "pressmark-mode");

/** Whatever `node_modules/@pressmark/*` currently points at — npm dir or ../pressmark. */
function pressmarkTarget() {
  return ["astro", "theme"]
    .map((name) => {
      const link = join(root, "node_modules", "@pressmark", name);
      return existsSync(link) ? realpathSync(link) : "missing";
    })
    .join("\n");
}

function clearCaches(why) {
  console.log(`Clearing .astro and node_modules/.vite — ${why}.`);
  for (const dir of CACHES) rmSync(join(root, dir), { recursive: true, force: true });
}

/**
 * Astro runs the server as a background daemon behind a lock file of its own.
 * Freeing the port is not enough on its own: a daemon that ended up on another
 * port is still registered, and the next start reports "already running" and
 * hands back that one, ignoring --port entirely. Ask Astro to stop it first,
 * so the lock goes with the process.
 */
function stopDaemon(mode) {
  spawnSync("astro", [mode, "stop"], { cwd: root, stdio: "ignore" });
}

/**
 * `lsof -t` alone also lists processes that merely hold the port open as a
 * client, so this asks only for listeners.
 */
function listenersOn(port) {
  const { stdout } = spawnSync("lsof", ["-t", `-iTCP:${port}`, "-sTCP:LISTEN"], {
    encoding: "utf8",
  });
  return (stdout ?? "")
    .split("\n")
    .map((line) => Number(line.trim()))
    .filter(Boolean);
}

function freePort(port) {
  let pids = listenersOn(port);
  if (!pids.length) return;

  console.log(`Port ${port} is taken by ${pids.join(", ")} — stopping it.`);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Already gone between the lsof and here.
    }
  }

  // SIGTERM is enough for Astro; the wait is for the socket to actually close,
  // otherwise the new server races the old one for the port and loses.
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    pids = listenersOn(port);
    if (!pids.length) return;
    spawnSync("sleep", ["0.2"]);
  }

  console.log(`Port ${port} still held by ${pids.join(", ")} — forcing.`);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // Already gone.
    }
  }
  spawnSync("sleep", ["0.5"]);
}

if (MODE === "dev") {
  const target = pressmarkTarget();
  const previous = existsSync(STAMP) ? readFileSync(STAMP, "utf8") : null;

  if (process.argv.includes("--fresh")) {
    clearCaches("asked for a fresh start");
  } else if (previous !== null && previous !== target) {
    clearCaches("Pressmark was swapped since the last run");
  }

  mkdirSync(dirname(STAMP), { recursive: true });
  writeFileSync(STAMP, target);

  console.log(
    target.includes(`${root}/node_modules/.pnpm/`)
      ? "Pressmark: published packages."
      : "Pressmark: local checkout — edits next door are live.",
  );
}

stopDaemon(MODE);
freePort(PORT);

const astro = spawn(
  "astro",
  [MODE, "--host", "--port", String(PORT)],
  { cwd: root, stdio: "inherit", shell: false },
);

astro.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => astro.kill(sig));
}

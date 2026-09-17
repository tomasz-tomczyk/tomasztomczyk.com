/**
 * Tests for per-post theming. Run with `npm test`.
 *
 * `assertReadable` fails `astro build`, so its thresholds are load-bearing:
 * too strict and the house palette can't ship, too loose and an unreadable
 * post goes live.
 */
import {
  contrast,
  luminance,
  resolveTheme,
  DEFAULT_ROLES,
  CONTRAST_FLOORS,
} from "./postTheme.ts";

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures++;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  FAIL ${name}\n       ${message.split("\n")[0]}`);
  }
}

function eq<T>(actual: T, expected: T, what: string): void {
  if (actual !== expected) {
    throw new Error(`${what}: got ${String(actual)}, want ${String(expected)}`);
  }
}

function near(actual: number, expected: number, what: string): void {
  if (Math.abs(actual - expected) > 0.05) {
    throw new Error(`${what}: got ${actual.toFixed(2)}, want ~${expected}`);
  }
}

function throws(fn: () => unknown, mustMention: string[], what: string): void {
  try {
    fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    for (const fragment of mustMention) {
      if (!message.includes(fragment)) {
        throw new Error(`${what}: error missing "${fragment}" — got: ${message}`);
      }
    }
    return;
  }
  throw new Error(`${what}: expected a throw, got none`);
}

/* ------------------------------------------------------------ colour maths */

console.log("contrast:");

check("black on white is 21:1", () => near(contrast("#000000", "#ffffff"), 21, "bw"));
check("a colour on itself is 1:1", () => near(contrast("#F6F4EE", "#F6F4EE"), 1, "same"));
check("argument order doesn't matter", () =>
  near(contrast("#000", "#fff"), contrast("#fff", "#000"), "symmetry"));
check("3-digit hex expands", () => near(contrast("#000", "#ffffff"), 21, "short"));
check("luminance: black is 0", () => near(luminance("#000000"), 0, "black"));
check("luminance: white is 1", () => near(luminance("#ffffff"), 1, "white"));

console.log("\nPressmark's shipped palette clears its own floors:");

check("ink on surface (~15.0)", () => {
  const ratio = contrast(DEFAULT_ROLES.ink, DEFAULT_ROLES.surface);
  near(ratio, 14.99, "ink");
  if (ratio < CONTRAST_FLOORS.ink) throw new Error("below floor");
});
check("accent on surface (~3.37)", () => {
  const ratio = contrast(DEFAULT_ROLES.accent, DEFAULT_ROLES.surface);
  near(ratio, 3.37, "accent");
  if (ratio < CONTRAST_FLOORS.accent) throw new Error("below floor");
});
check("muted on surface (~2.24)", () => {
  const ratio = contrast(DEFAULT_ROLES.muted, DEFAULT_ROLES.surface);
  near(ratio, 2.24, "muted");
  if (ratio < CONTRAST_FLOORS.muted) throw new Error("below floor");
});

/* --------------------------------------------------------------- resolving */

console.log("\nresolveTheme:");

check("no theme emits no style and stays light", () => {
  const r = resolveTheme(undefined, "test");
  eq(r.style, undefined, "style");
  eq(r.colorScheme, "light", "colorScheme");
});

check("only changed roles are emitted", () => {
  const r = resolveTheme({ accent: "#2b6cb0" }, "test");
  eq(r.style, "--color-accent:#2b6cb0", "style");
});

check("a role set to its default is not emitted", () => {
  const r = resolveTheme({ accent: DEFAULT_ROLES.accent }, "test");
  eq(r.style, undefined, "style");
});

check("a full dark set passes and reports dark", () => {
  const r = resolveTheme(
    {
      surface: "#14161A",
      raised: "#1C1F24",
      line: "#2A2E35",
      muted: "#8B9199",
      ink: "#E8E6E1",
      accent: "#4a9eff",
      // A dark set is only "full" once the code roles move with raised.
      "code-string": "#72D699",
      "code-function": "#E79AD6",
      "code-number": "#EEB154",
      "code-variable": "#5ED1DE",
    },
    "test",
  );
  eq(r.colorScheme, "dark", "colorScheme");
  if (!r.style?.includes("--color-surface:#14161A")) throw new Error(String(r.style));
});

check("font stacks pass through", () => {
  const r = resolveTheme({ fontDisplay: "'Space Grotesk', sans-serif" }, "test");
  if (!r.style?.includes("--font-display:'Space Grotesk', sans-serif")) {
    throw new Error(String(r.style));
  }
});

check("fontUrl is returned for per-page loading", () => {
  const r = resolveTheme({ fontUrl: "https://fonts.example/x.css" }, "test");
  eq(r.fontUrl, "https://fonts.example/x.css", "fontUrl");
});

console.log("\nthe guard:");

check("dark surface with forgotten text roles is rejected", () =>
  throws(
    () => resolveTheme({ surface: "#14161A" }, "src/content/posts/oban.md"),
    ["ink", "src/content/posts/oban.md"],
    "half-themed",
  ));

check("names every failing role at once, not just the first", () =>
  throws(
    () => resolveTheme({ surface: "#1F1F1F" }, "test"),
    ["ink", "accent", "muted"],
    "all roles",
  ));

check("the mockup blue is rejected on the cream surface (2.5:1)", () =>
  throws(() => resolveTheme({ accent: "#4a9eff" }, "test"), ["accent"], "low accent"));

check("a non-hex value is rejected", () =>
  throws(() => resolveTheme({ accent: "rebeccapurple" }, "test"), ["hex"], "bad hex"));

check("a malformed hex is rejected", () =>
  throws(() => resolveTheme({ ink: "#12345" }, "test"), ["hex"], "short hex"));

/* ------------------------------------------------- code roles (syntax) */

check("code roles default to Pressmark's shipped values", () => {
  const { style } = resolveTheme({}, "test");
  eq(style, undefined, "untouched theme emits no style");
  eq(DEFAULT_ROLES["code-string"], "#007E46", "string default");
  eq(DEFAULT_ROLES["code-function"], "#913F82", "function default");
  eq(DEFAULT_ROLES["code-number"], "#0465AF", "number default");
  eq(DEFAULT_ROLES["code-variable"], "#007481", "variable default");
});

check("a code role is emitted as --color-code-* when overridden", () => {
  const { style } = resolveTheme({ "code-string": "#2F5E46" }, "test");
  if (!style?.includes("--color-code-string:#2F5E46")) {
    throw new Error(`expected --color-code-string in style, got: ${style}`);
  }
});

/* Code roles sit on `raised`, not `surface`: a theme can be fine against the
   page and still invisible in a code block. */
check("code roles are measured against raised, not surface", () => {
  // Legible on the cream surface (7.4:1) but nearly invisible on a dark
  // raised — only a raised-based check catches it.
  throws(
    () => resolveTheme({ raised: "#3D5A4C", "code-string": "#007E46" }, "test"),
    ["code-string", "raised"],
    "code on raised",
  );
});

check("dark post re-points raised but forgets the code roles", () =>
  throws(
    () =>
      resolveTheme(
        {
          surface: "#14161A",
          raised: "#1C1F24",
          line: "#2A2E35",
          muted: "#8B9199",
          ink: "#E8E6E1",
          accent: "#4A9EFF",
        },
        "src/content/posts/absinthe",
      ),
    // code-string is absent on purpose: the shipped green is 3.20:1 even on
    // this dark raised, so it clears the floor on its own.
    ["code-function", "code-number", "src/content/posts/absinthe"],
    "dark post, default code roles",
  ));

check("a dark post that declares its own code roles passes", () => {
  const { style } = resolveTheme(
    {
      surface: "#14161A",
      raised: "#1C1F24",
      line: "#2A2E35",
      muted: "#8B9199",
      ink: "#E8E6E1",
      accent: "#4A9EFF",
      "code-string": "#72D699",
      "code-function": "#E79AD6",
      "code-number": "#EEB154",
      "code-variable": "#5ED1DE",
    },
    "test",
  );
  if (!style?.includes("--color-code-function:#E79AD6")) {
    throw new Error(`expected code roles in style, got: ${style}`);
  }
});

check("code roles use the accent floor (3.0), not ink's 4.5", () => {
  eq(CONTRAST_FLOORS["code-string"], CONTRAST_FLOORS.accent, "code floor tracks accent");
  // 3.52:1 on the shipped raised — would fail ink's 4.5, must pass at 3.0.
  const mid = "#5F8271";
  near(contrast(mid, DEFAULT_ROLES.raised), 3.52, "test colour sits between the floors");
  resolveTheme({ "code-string": mid }, "test"); // throws if the floor is 4.5
});

check("every shipped code role clears its floor on the shipped raised", () => {
  for (const role of ["code-string", "code-function", "code-number", "code-variable"] as const) {
    const ratio = contrast(DEFAULT_ROLES[role], DEFAULT_ROLES.raised);
    if (ratio < CONTRAST_FLOORS[role]) {
      throw new Error(
        `${role} ships at ${ratio.toFixed(2)}:1, below its own floor ${CONTRAST_FLOORS[role]}`,
      );
    }
  }
});

console.log(failures ? `\n${failures} FAILED` : "\nall passed");
process.exit(failures ? 1 : 0);

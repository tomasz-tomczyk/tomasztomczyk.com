/**
 * Per-post theming.
 *
 * Pressmark ships one palette — light, six roles — and deliberately has no dark
 * mode. Every role is a plain CSS custom property, so a post can re-point any
 * of them for its own page. That is what this module builds: a style string for
 * <html>, from free-form values in the post's frontmatter.
 *
 * A post's look is PINNED. There is no reader-preference switching; what the
 * frontmatter says is what everybody sees. The one thing derived automatically
 * is the CSS `color-scheme` hint, computed from the surface colour so scrollbars
 * and form controls match rather than flashing white on a dark page.
 *
 * Free-form means a typo can ship an unreadable page, so `assertReadable`
 * runs at build time and throws. See `CONTRAST_FLOORS`.
 */

/** Pressmark's shipped values — the baseline a post overrides from. */
export const DEFAULT_ROLES = {
  surface: "#F6F4EE",
  raised: "#ECE9E2",
  line: "#D9D6CC",
  muted: "#ABA49A",
  ink: "#1F1F1F",
  accent: "#E05A24",

  /**
   * Syntax roles, used only inside code blocks. Pressmark's palette rule is
   * "exactly six colours"; these are a documented exception, scoped to code.
   * They sit on `raised` (the code background), not on `surface`.
   *
   * Kebab-case so `--color-${role}` stays a mechanical mapping — a camelCase
   * key would emit `--color-codeString`.
   */
  "code-string": "#007E46",
  "code-function": "#913F82",
  "code-number": "#0465AF",
  "code-variable": "#007481",
} as const;

export type RoleName = keyof typeof DEFAULT_ROLES;

export type PostTheme = {
  surface?: string;
  raised?: string;
  line?: string;
  muted?: string;
  ink?: string;
  accent?: string;
  "code-string"?: string;
  "code-function"?: string;
  "code-number"?: string;
  "code-variable"?: string;
  fontDisplay?: string;
  fontBody?: string;
  fontMono?: string;
  /** A stylesheet href for faces this post needs. Loaded on this page only. */
  fontUrl?: string;
};

/* ---------------------------------------------------------------- contrast */

function parseHex(hex: string): [number, number, number] {
  const h = hex.trim().replace(/^#/, "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(
      `postTheme: "${hex}" is not a 3- or 6-digit hex colour (e.g. "#4a9eff").`,
    );
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance. */
export function luminance(hex: string): number {
  const channels = parseHex(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two colours, 1–21. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Minimum contrast per role, against the background that role is drawn on.
 *
 * These are NOT WCAG AA. Pressmark's own palette is knowingly below AA
 * (`muted` is 2.24:1, `accent` 3.37:1) and holding it to AA would fail the
 * house style on every page. The job here is to catch the failure free-form
 * theming actually produces: a post that re-points a background and forgets a
 * text role, landing near 1:1 and rendering invisible.
 *
 * Each floor sits just under Pressmark's shipped ratio for that role.
 */
export const CONTRAST_FLOORS = {
  ink: 4.5, // body text — the one role held to a real reading standard
  accent: 3.0, // links and CTAs (shipped: 3.37)
  muted: 2.0, // tiny mono captions only (shipped: 2.24)
  // Syntax accents, not body text, so they take accent's floor rather than
  // ink's. Shipped: 4.25, 5.35, 4.97 on cream — headroom spent on chroma, not darkness.
  "code-string": 3.0,
  "code-function": 3.0,
  "code-number": 3.0,
  "code-variable": 3.0,
} as const satisfies Partial<Record<RoleName, number>>;

export type CheckedRole = keyof typeof CONTRAST_FLOORS;

/**
 * Which background each checked role is judged against.
 *
 * Page text is measured on `surface`. Code tokens are measured on `raised`,
 * because that is what a code block is painted with — a colour can be fine
 * against the page and still invisible inside a snippet. Getting this wrong
 * is silent: the build passes and the code block is unreadable.
 */
export const ROLE_BACKGROUND = {
  ink: "surface",
  accent: "surface",
  muted: "surface",
  "code-string": "raised",
  "code-function": "raised",
  "code-number": "raised",
  "code-variable": "raised",
} as const satisfies Record<CheckedRole, "surface" | "raised">;

/**
 * Throw if any text role is unreadable on its surface.
 *
 * Called at build time from the post page, so a bad theme fails `astro build`
 * rather than shipping.
 */
export function assertReadable(roles: Record<RoleName, string>, where: string): void {
  const problems: string[] = [];

  for (const role of Object.keys(CONTRAST_FLOORS) as CheckedRole[]) {
    const against = ROLE_BACKGROUND[role];
    const ratio = contrast(roles[role], roles[against]);
    const floor = CONTRAST_FLOORS[role];
    if (ratio < floor) {
      problems.push(
        `  ${role} ${roles[role]} on ${against} ${roles[against]} ` +
          `= ${ratio.toFixed(2)}:1, needs ${floor}:1`,
      );
    }
  }

  if (problems.length) {
    throw new Error(
      `Unreadable theme in ${where}:\n${problems.join("\n")}\n` +
        `Re-point every text role when you change a background — ` +
        `surface, raised, line, muted, ink and accent move together, and the ` +
        `code-* roles move with raised.`,
    );
  }
}

/* ------------------------------------------------------------------ build */

export type ResolvedTheme = {
  /** Inline style for <html>, or undefined when the post uses the defaults. */
  style?: string;
  /** "dark" when the surface is dark, so browser UI matches. */
  colorScheme: "light" | "dark";
  /** Stylesheet href this post needs, if any. */
  fontUrl?: string;
};

/**
 * Resolve frontmatter into what the layout needs.
 *
 * `where` identifies the post in the error message when the theme is unreadable.
 */
export function resolveTheme(theme: PostTheme | undefined, where: string): ResolvedTheme {
  const t = theme ?? {};

  const roles: Record<RoleName, string> = {
    surface: t.surface ?? DEFAULT_ROLES.surface,
    raised: t.raised ?? DEFAULT_ROLES.raised,
    line: t.line ?? DEFAULT_ROLES.line,
    muted: t.muted ?? DEFAULT_ROLES.muted,
    ink: t.ink ?? DEFAULT_ROLES.ink,
    accent: t.accent ?? DEFAULT_ROLES.accent,
    "code-string": t["code-string"] ?? DEFAULT_ROLES["code-string"],
    "code-function": t["code-function"] ?? DEFAULT_ROLES["code-function"],
    "code-number": t["code-number"] ?? DEFAULT_ROLES["code-number"],
    "code-variable": t["code-variable"] ?? DEFAULT_ROLES["code-variable"],
  };

  assertReadable(roles, where);

  const decls: string[] = [];
  for (const [role, value] of Object.entries(roles) as [RoleName, string][]) {
    if (value !== DEFAULT_ROLES[role]) decls.push(`--color-${role}:${value}`);
  }
  if (t.fontDisplay) decls.push(`--font-display:${t.fontDisplay}`);
  if (t.fontBody) decls.push(`--font-body:${t.fontBody}`);
  if (t.fontMono) decls.push(`--font-mono:${t.fontMono}`);

  return {
    style: decls.length ? decls.join(";") : undefined,
    // 0.5 splits the luminance range; anything darker gets dark browser UI.
    colorScheme: luminance(roles.surface) < 0.5 ? "dark" : "light",
    fontUrl: t.fontUrl,
  };
}

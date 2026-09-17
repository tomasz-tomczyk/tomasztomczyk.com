import calendar from "../../public/icons/calendar.svg?raw";
import clock from "../../public/icons/clock.svg?raw";
import email from "../../public/icons/email.svg?raw";
import github from "../../public/icons/github.svg?raw";
import linkedin from "../../public/icons/linkedin.svg?raw";
import bluesky from "../../public/icons/bluesky.svg?raw";
import elixir from "../../public/icons/elixir.svg?raw";
import aiDevelopment from "../../public/icons/ai-assisted-development.svg?raw";
import vetspire from "../../public/icons/vetspire.svg?raw";
import toyota from "../../public/icons/toyota.svg?raw";
import uswitch from "../../public/icons/uswitch.svg?raw";

const sources = {
  calendar,
  clock,
  email,
  github,
  linkedin,
  bluesky,
  elixir,
  "ai-assisted-development": aiDevelopment,
  vetspire,
  toyota,
  uswitch,
};

export type IconName = keyof typeof sources;

// Keep the source SVG's paint settings when its contents are placed inline.
export function iconMarkup(name: IconName): string {
  const svg = sources[name];
  const opening = svg.slice(0, svg.indexOf(">"));
  const paint = opening.match(/(?:fill|stroke|stroke-width|stroke-linecap|stroke-linejoin)="[^"]*"/g)?.join(" ") ?? "";
  const body = svg.slice(svg.indexOf(">") + 1, svg.lastIndexOf("</svg>"));
  return `<g ${paint}>${body}</g>`;
}

const labels: Record<string, IconName> = {
  elixir: "elixir",
  "ai-assisted-development": "ai-assisted-development",
  "ai assisted development": "ai-assisted-development",
  vetspire: "vetspire",
  toyota: "toyota",
  "toyota connected": "toyota",
  "toyota connected europe": "toyota",
  uswitch: "uswitch",
  "uswitch.com": "uswitch",
};

export function iconForLabel(label: string): IconName | undefined {
  return labels[label.trim().toLowerCase()];
}

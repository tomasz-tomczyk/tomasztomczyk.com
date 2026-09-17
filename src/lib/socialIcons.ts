import type { IconName } from "@lib/icons";

/** Social labels and their SVG assets in the shared inline icon library. */
export const SOCIAL_ICONS: Record<string, { label: string; icon: IconName }> = {
  email: { label: "Email", icon: "email" },
  github: { label: "GitHub", icon: "github" },
  linkedin: { label: "LinkedIn", icon: "linkedin" },
  bluesky: { label: "Bluesky", icon: "bluesky" },
};

export type SocialIconName = keyof typeof SOCIAL_ICONS;

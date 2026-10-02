import { THEMES } from "@/components/home/themes";
import { THEME_IDS } from "@/components/invitation/themes/theme-ids";

/**
 * Whether the workshop switcher may be shown: always outside production, and
 * in production only with `THEME_ATELIER=1`. Couples and guests never see it.
 */
export function atelierEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.THEME_ATELIER === "1";
}

/** Every registered theme, in the home page's order first, then any it does not list. */
export function atelierThemes(): { id: string; name: string }[] {
  const listed = new Set<string>(THEMES.map((theme) => theme.id));
  return [
    ...THEMES.map((theme) => ({ id: theme.id, name: theme.name })),
    ...THEME_IDS.filter((id) => !listed.has(id)).map((id) => ({ id, name: id })),
  ];
}

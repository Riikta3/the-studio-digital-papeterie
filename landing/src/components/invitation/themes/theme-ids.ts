/**
 * Every registered theme id, and nothing else.
 *
 * Separate from `registry.ts` on purpose. A manifest holds its theme's `Root`
 * component, demo data and `next/font` calls, so importing the registry to ask
 * "which themes exist?" drags all three themes' markup, CSS and fonts into
 * whatever imports it — the sitemap route and the marketing pages need a list
 * of strings, not that.
 *
 * Generated from the folders on disk by `npm run themes:sync`, the same script
 * that generates the registry's import block, so adding a theme folder still
 * requires editing no existing file by hand.
 */

// ─── THEME IDS — generated, do not edit by hand ───────────────────────────────
export const THEME_IDS = ["belle-rive", "blanc-couture", "ciao-amore"] as const;
// ─── END GENERATED ───────────────────────────────────────────────────────────

export type ThemeId = (typeof THEME_IDS)[number];

/** Whether a slug names a registered theme. Narrows for route handlers. */
export function isThemeId(id: string): id is ThemeId {
  return (THEME_IDS as readonly string[]).includes(id);
}

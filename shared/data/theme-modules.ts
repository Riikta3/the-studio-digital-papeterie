/**
 * The modules each invitation theme draws — the `supports` list of every
 * `landing/src/components/invitation/themes/<id>/theme.config.ts`, copied here
 * by `npm run themes:sync -w landing` (`themes:check` fails when it is stale).
 *
 * The dashboard cannot import the themes: they bring React sections, CSS and
 * fonts. This is the one fact about them it needs — which modules a couple's
 * theme will actually show — to offer and sell only those
 * (docs/superpowers/specs/2026-09-28-dashboard-module-purchase-design.md, D9).
 */

// ─── THEME MODULES — generated, do not edit by hand ───────────────────────────
export const FALLBACK_THEME_ID = "belle-rive";
export const THEME_MODULES: Readonly<Record<string, readonly string[]>> = {
  "belle-rive": ["countdown", "map", "timeline", "dress-code", "accommodation", "playlist", "faq", "rsvp", "gift-list"],
  "blanc-couture": ["countdown", "map", "timeline", "dress-code", "accommodation", "transport", "playlist", "faq", "rsvp"],
  "cabo-verde": ["countdown", "map", "timeline", "dress-code", "accommodation", "playlist", "transport", "rsvp"],
  "chateau-royal": ["timeline", "menu", "map", "dress-code", "faq", "transport", "rsvp"],
  "ciao-amore": ["countdown", "timeline", "dress-code", "map", "accommodation", "playlist", "faq", "rsvp", "intro-video", "menu", "gallery", "gift-list", "transport"],
  "mare-alta": ["countdown", "timeline", "dress-code", "map", "accommodation", "transport", "menu", "playlist", "gift-list", "rsvp", "faq"],
};
// ─── END GENERATED ───────────────────────────────────────────────────────────

/**
 * The modules `themeId` draws. An unknown id gets the fallback theme's, which
 * is what the invitation renders for it (`getTheme(id) ?? THEMES[0]`).
 */
export function themeModules(themeId: string | null | undefined): readonly string[] {
  return THEME_MODULES[themeId ?? ""] ?? THEME_MODULES[FALLBACK_THEME_ID] ?? [];
}

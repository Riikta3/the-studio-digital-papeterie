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
  "cabo-verde": ["countdown", "map", "timeline", "dress-code", "accommodation", "playlist", "transport", "rsvp", "intro-video", "gallery", "menu", "faq", "gift-list", "guestbook"],
  "chateau-royal": ["countdown", "intro-video", "timeline", "menu", "map", "playlist", "gallery", "dress-code", "faq", "transport", "accommodation", "gift-list", "rsvp", "guestbook"],
  "ciao-amore": ["countdown", "timeline", "dress-code", "map", "accommodation", "playlist", "faq", "rsvp", "intro-video", "menu", "gallery", "gift-list", "guestbook", "transport"],
  "mare-alta": ["countdown", "intro-video", "timeline", "dress-code", "map", "accommodation", "transport", "menu", "playlist", "gallery", "gift-list", "rsvp", "guestbook", "faq"],
};
// ─── END GENERATED ───────────────────────────────────────────────────────────

/**
 * The modules `themeId` draws. An unknown id gets the fallback theme's, which
 * is what the invitation renders for it (`getTheme(id) ?? THEMES[0]`).
 */
export function themeModules(themeId: string | null | undefined): readonly string[] {
  return THEME_MODULES[themeId ?? ""] ?? THEME_MODULES[FALLBACK_THEME_ID] ?? [];
}

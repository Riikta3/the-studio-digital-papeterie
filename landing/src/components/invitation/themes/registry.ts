import type { ThemeManifest } from "./types";

// ─── THEME IMPORTS — generated, do not edit by hand ───────────────────────────
// Run `npm run themes:sync` (landing/scripts/sync-themes.mjs) after adding or
// removing a theme folder. A bundler cannot discover modules at runtime, so the
// import list has to be static; the script keeps it in step with the folders.
import { belleRiveTheme } from "./belle-rive/theme.config";
import { blancCoutureTheme } from "./blanc-couture/theme.config";
import { ciaoAmoreTheme } from "./ciao-amore/theme.config";

const MANIFESTS: ThemeManifest[] = [belleRiveTheme, blancCoutureTheme, ciaoAmoreTheme];
// ─── END GENERATED ───────────────────────────────────────────────────────────

/** Every registered theme, in registry order. */
export const THEMES: readonly ThemeManifest[] = MANIFESTS;

const BY_ID = new Map(MANIFESTS.map((theme) => [theme.id, theme]));

/** The theme a `sites.theme_id` points at, or `undefined` if it is unknown. */
export function getTheme(id: string | null | undefined): ThemeManifest | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/**
 * The theme to render for a wedding.
 *
 * Falls back to the first registered theme rather than throwing: a stale or
 * mistyped `theme_id` in the database should still produce an invitation, not
 * a 500 on a page a couple has already paid for.
 */
export function resolveTheme(id: string | null | undefined): ThemeManifest {
  return getTheme(id) ?? MANIFESTS[0];
}

/** Theme ids, for `generateStaticParams` on the demo routes. */
export function themeIds(): string[] {
  return MANIFESTS.map((theme) => theme.id);
}

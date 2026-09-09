import { THEME_IDS, isThemeId } from "@/components/invitation/themes/theme-ids";
import { routing } from "@/navigation";

/**
 * The locales the theme marketing pages exist in.
 *
 * French only, deliberately, and this is the whole reason this module exists.
 *
 * The pages are carried by ~500 words of editorial copy per theme in the
 * `Themes` namespace. That namespace is written in `messages/fr.json` and
 * nowhere else, and next-intl's default `getMessageFallback` renders a missing
 * key as the key itself — so an English visitor would get a page whose heading
 * reads `Themes.items.belle-rive.h1`, and Google would index it. There is no
 * `onError` override in `src/i18n.ts` to change that.
 *
 * Publishing eight machine translations of unvalidated marketing copy is the
 * other way to fill the gap, and it is worse: thin duplicate content in eight
 * languages, on pages whose entire purpose is to rank.
 *
 * So the other eight locales 404 rather than render, and `buildAlternates` is
 * NOT used on these routes — advertising hreflang for URLs that return 404
 * tells Google the set is broken. When a locale's copy is written, add it here
 * and the sitemap, hreflang and static params all follow.
 */
export const THEME_PAGE_LOCALES = ["fr"] as const;

export type ThemePageLocale = (typeof THEME_PAGE_LOCALES)[number];

/** Whether the theme pages are published in this locale. */
export function hasThemePages(locale: string): locale is ThemePageLocale {
  return (THEME_PAGE_LOCALES as readonly string[]).includes(locale);
}

/**
 * `generateStaticParams` for the collection page.
 *
 * Returns only the locales that have copy, so Next never prerenders a locale
 * whose page is a 404.
 */
export function themePageLocaleParams() {
  return THEME_PAGE_LOCALES.map((locale) => ({ locale }));
}

/** `generateStaticParams` for the per-theme pages: every published locale × every theme. */
export function themePageParams() {
  return THEME_PAGE_LOCALES.flatMap((locale) =>
    THEME_IDS.map((slug) => ({ locale, slug })),
  );
}

/**
 * The order themes are listed in, matching the home page's carousel.
 *
 * Read from `THEME_IDS` (generated from the folders) rather than hardcoded, so
 * a new theme folder appears here on its own. `home/themes.ts` holds the same
 * ids for the client carousel; it is not imported because it is a client
 * module that also carries thumbnails, and these pages are Server Components
 * that only need slugs.
 */
export const THEME_PAGE_SLUGS = THEME_IDS;

export { isThemeId };

/**
 * The locale-less path of a theme page: "/themes" or "/themes/<slug>".
 *
 * This is the shape `buildOpenGraph` and `buildAlternates` expect — they
 * prepend the locale themselves — so it must NOT carry one.
 */
export function themePageSlugPath(slug?: string): string {
  return slug ? `/themes/${slug}` : "/themes";
}

/** Absolute path of a theme's marketing page, for internal links and the sitemap. */
export function themePagePath(locale: string, slug?: string): string {
  return `/${locale}${themePageSlugPath(slug)}`;
}

/**
 * The canonical for a theme page.
 *
 * Hand-built rather than via `buildAlternates`: that helper emits an hreflang
 * entry for all nine locales plus `x-default`, and eight of those URLs 404
 * here. A self-referencing canonical with no `languages` map is the honest
 * signal while the pages are French-only.
 */
export function themePageAlternates(locale: string, siteUrl: string, slug?: string) {
  return { canonical: `${siteUrl}${themePagePath(locale, slug)}` };
}

/** Guard for the locale segment, so an unpublished locale is a 404 not a broken page. */
export function assertThemePageLocale(locale: string): boolean {
  return hasThemePages(locale) && (routing.locales as readonly string[]).includes(locale);
}

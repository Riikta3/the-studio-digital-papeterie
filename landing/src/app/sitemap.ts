import type { MetadataRoute } from "next";

import { THEME_IDS } from "@/components/invitation/themes/theme-ids";
import { getSiteUrl } from "@/lib/site";
import { routing } from "@/navigation";

/**
 * Public, indexable routes only — the studio funnel and the guest /jourj pages
 * are disallowed in robots.ts and deliberately absent here.
 *
 * `lastModified` is an explicit date per path, not `new Date()`. The sitemap
 * is rendered on demand (the root layout reads headers(), so nothing in this
 * app prerenders), which meant every crawl reported all URLs as having changed
 * seconds ago. Google discounts a <lastmod> it decides is unreliable, and once
 * discounted it stops being a recrawl hint even when a page genuinely changes.
 *
 * Bump the date on the line you touched, in the same commit that changes the
 * page's content or copy. A wrong-but-stable date costs nothing; a date that
 * moves on its own costs the signal.
 */
type SitemapPath = {
  /** Locale-less, no trailing slash. "" is the homepage. */
  path: string;
  /** ISO date (YYYY-MM-DD) of the last meaningful content change. */
  lastModified: string;
};

const STATIC_PATHS: SitemapPath[] = [
  { path: "", lastModified: "2026-09-07" },
  { path: "/themes", lastModified: "2026-09-07" },
  { path: "/legal/cgv", lastModified: "2026-08-30" },
  { path: "/legal/privacy", lastModified: "2026-08-30" },
];

/**
 * Guard against shipping this file before the pages it advertises exist.
 *
 * A sitemap that lists URLs returning 404 is worse than one that omits them:
 * Google records the errors against the whole site and trusts the file less.
 * Flip this to `true` in the same commit that adds `/[locale]/themes` and
 * `/[locale]/themes/[slug]`, and delete the constant once they have shipped.
 */
const THEME_PAGES_SHIPPED = false;

/**
 * One entry per registered theme, derived from the generated id list so that
 * adding a theme folder adds its sitemap entry with no list to remember here.
 * `theme-ids.ts` rather than the registry: a manifest carries its theme's Root
 * component and fonts, and this route only needs the slugs.
 *
 * They share one date because a theme page's copy is generated from its
 * manifest and the shared `Themes` messages: they change together.
 */
const THEME_PAGES_LAST_MODIFIED = "2026-09-07";

export default function sitemap(): MetadataRoute.Sitemap {
  // See robots.ts: resolved here rather than at module load.
  const siteUrl = getSiteUrl();

  const paths: SitemapPath[] = THEME_PAGES_SHIPPED
    ? [
        ...STATIC_PATHS,
        ...THEME_IDS.map((id) => ({
          path: `/themes/${id}`,
          lastModified: THEME_PAGES_LAST_MODIFIED,
        })),
      ]
    : STATIC_PATHS.filter(({ path }) => !path.startsWith("/themes"));

  return routing.locales.flatMap((locale) =>
    paths.map(({ path, lastModified }) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
      },
    })),
  );
}

import type { MetadataRoute } from "next";

import { THEME_IDS } from "@/components/invitation/themes/theme-ids";
import {
  LANDING_LOCALES,
  LANDING_SLUGS,
  landingPath,
} from "@/lib/landing-pages";
import {
  JOURNAL_LOCALES,
  JOURNAL_SLUGS,
  journalPath,
} from "@/lib/journal";
import { getSiteUrl } from "@/lib/site";
import { THEME_PAGE_LOCALES, themePagePath } from "@/lib/theme-pages";
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

/** Paths that exist in every locale, listed with a full hreflang set. */
const STATIC_PATHS: SitemapPath[] = [
  { path: "", lastModified: "2026-09-07" },
  { path: "/legal/cgv", lastModified: "2026-08-30" },
  { path: "/legal/privacy", lastModified: "2026-08-30" },
];

/**
 * The theme pages' own date, kept apart from `STATIC_PATHS` because they are
 * not a nine-locale route: their copy lives only in `messages/fr.json`, so
 * `THEME_PAGE_LOCALES` is `["fr"]` and the other eight 404.
 *
 * They share one date because the collection page and the per-theme pages are
 * driven by the same `Themes` namespace and change together.
 */
const THEME_PAGES_LAST_MODIFIED = "2026-09-09";

/** The Journal's own date: the five launch articles ship together. */
const JOURNAL_LAST_MODIFIED = "2026-09-09";

/** The three commercial landing pages, shipped together. */
const LANDING_LAST_MODIFIED = "2026-09-09";

export default function sitemap(): MetadataRoute.Sitemap {
  // See robots.ts: resolved here rather than at module load.
  const siteUrl = getSiteUrl();

  // Every locale × every fully-translated path, each with the complete
  // hreflang map.
  const localised = routing.locales.flatMap((locale) =>
    STATIC_PATHS.map(({ path, lastModified }) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
      },
    })),
  );

  // The theme pages, in the locales that actually have copy.
  //
  // No `alternates`: an hreflang map listing nine URLs when eight of them 404
  // tells Google the cluster is broken, and a map with a single entry pointing
  // at the URL itself says nothing the canonical does not already say. When a
  // second locale's copy lands, add it to `THEME_PAGE_LOCALES` and give these
  // entries a real map built from that list.
  const themePages = THEME_PAGE_LOCALES.flatMap((locale) => [
    {
      url: `${siteUrl}${themePagePath(locale)}`,
      lastModified: THEME_PAGES_LAST_MODIFIED,
    },
    ...THEME_IDS.map((id) => ({
      url: `${siteUrl}${themePagePath(locale, id)}`,
      lastModified: THEME_PAGES_LAST_MODIFIED,
    })),
  ]);

  // The Journal, same shape and same reasoning: French-only, no hreflang.
  // Driven off JOURNAL_SLUGS so publishing an article is one list to edit.
  const journalPages = JOURNAL_LOCALES.flatMap((locale) => [
    {
      url: `${siteUrl}${journalPath(locale)}`,
      lastModified: JOURNAL_LAST_MODIFIED,
    },
    ...JOURNAL_SLUGS.map((slug) => ({
      url: `${siteUrl}${journalPath(locale, slug)}`,
      lastModified: JOURNAL_LAST_MODIFIED,
    })),
  ]);

  // The commercial landing pages. Same French-only shape, same absence of
  // hreflang, and listed after the Journal so the file reads in the order the
  // sets were added.
  const landingPages = LANDING_LOCALES.flatMap((locale) =>
    LANDING_SLUGS.map((slug) => ({
      url: `${siteUrl}${landingPath(locale, slug)}`,
      lastModified: LANDING_LAST_MODIFIED,
    })),
  );

  return [...localised, ...themePages, ...journalPages, ...landingPages];
}

/**
 * The commercial landing pages.
 *
 * Distinct from the Journal in intent, and the distinction is load bearing:
 * a Journal article answers a question ("quand envoyer ses faire-part ?") and
 * earns informational traffic; these three answer "what do you sell, and what
 * does it cost". Both sets talk about the same product, so any section that
 * reads the same on both would put two of our own URLs in competition for one
 * query — the copy is deliberately angled differently (the guide explains the
 * concept, the landing page describes what The Studio delivers).
 *
 * The slugs are the target keywords, unprefixed: "faire-part mariage digital",
 * "RSVP mariage en ligne", "prix faire-part mariage".
 */
export const LANDING_SLUGS = [
  "faire-part-mariage-digital",
  "rsvp-en-ligne",
  "tarifs",
] as const;

export type LandingSlug = (typeof LANDING_SLUGS)[number];

export function isLandingSlug(slug: string): slug is LandingSlug {
  return (LANDING_SLUGS as readonly string[]).includes(slug);
}

/**
 * French only, for the third time in this codebase and for the same reason
 * each time: the copy lives in `messages/fr.json` alone, and next-intl's
 * default `getMessageFallback` renders a missing key as the key itself, so
 * another locale would serve `Landing.pages.tarifs.h1` as its heading.
 *
 * Kept as its own constant rather than shared with `THEME_PAGE_LOCALES` or
 * `JOURNAL_LOCALES`: these three sets will not be translated at the same time,
 * and one shared list would force them to move together.
 */
export const LANDING_LOCALES = ["fr"] as const;

export function hasLandingPages(locale: string): boolean {
  return (LANDING_LOCALES as readonly string[]).includes(locale);
}

/** `generateStaticParams`: every published locale × every slug. */
export function landingParams() {
  return LANDING_LOCALES.flatMap((locale) =>
    LANDING_SLUGS.map((slug) => ({ slug, locale })),
  );
}

/** Locale-less path, the shape `buildOpenGraph` expects. */
export function landingSlugPath(slug: string): string {
  return `/${slug}`;
}

/** Absolute path, for internal links and the sitemap. */
export function landingPath(locale: string, slug: string): string {
  return `/${locale}/${slug}`;
}

/**
 * Self-referencing canonical, no `languages` map — an hreflang set naming nine
 * URLs when eight of them 404 tells Google the cluster is broken. Same
 * reasoning as `themePageAlternates` and `journalAlternates`.
 */
export function landingAlternates(locale: string, siteUrl: string, slug: string) {
  return { canonical: `${siteUrl}${landingPath(locale, slug)}` };
}

/**
 * Which of these three pages carries the pricing table.
 *
 * `/tarifs` renders the plans and the comparison matrix from the `Pricing`
 * namespace the homepage already uses, so the numbers cannot drift from the
 * ones the studio actually charges. The other two are prose only.
 */
export function showsPricing(slug: LandingSlug): boolean {
  return slug === "tarifs";
}

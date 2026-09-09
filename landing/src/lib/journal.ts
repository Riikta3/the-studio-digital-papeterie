/**
 * The Journal's published articles.
 *
 * The list is here, in code, rather than derived from the message file: a
 * route needs `generateStaticParams` and the sitemap needs slugs, and neither
 * can enumerate translation keys without loading the whole namespace. Adding
 * an article means adding its slug here and its copy under `Journal.articles`
 * in `messages/fr.json` — the two must move together, and a slug listed here
 * with no copy renders its own message keys as visible text.
 *
 * Order is editorial: it is the order the index page lists them in, most
 * useful first, not chronological. There are no dates on the articles —
 * evergreen advice does not benefit from looking six months old.
 */
export const JOURNAL_SLUGS = [
  "faire-part-mariage-digital",
  "que-mettre-faire-part-mariage",
  "quand-envoyer-faire-part-mariage",
  "textes-faire-part-mariage",
  "gerer-rsvp-mariage",
] as const;

export type JournalSlug = (typeof JOURNAL_SLUGS)[number];

export function isJournalSlug(slug: string): slug is JournalSlug {
  return (JOURNAL_SLUGS as readonly string[]).includes(slug);
}

/**
 * The locales the Journal is published in.
 *
 * French only, for the same reason as the theme pages: the copy exists in
 * `messages/fr.json` alone, and next-intl's default `getMessageFallback`
 * renders a missing key as the key itself, so another locale would serve
 * `Journal.articles.gerer-rsvp-mariage.h1` as its heading and Google would
 * index it. Machine-translating long-form editorial copy into eight languages
 * would be worse — thin duplicate content on pages whose only job is to rank.
 *
 * Kept separate from `THEME_PAGE_LOCALES` deliberately: the two sets will
 * diverge as soon as one of them is translated first.
 */
export const JOURNAL_LOCALES = ["fr"] as const;

export function hasJournal(locale: string): boolean {
  return (JOURNAL_LOCALES as readonly string[]).includes(locale);
}

/** `generateStaticParams` for the index. */
export function journalLocaleParams() {
  return JOURNAL_LOCALES.map((locale) => ({ locale }));
}

/** `generateStaticParams` for the articles: every published locale × every slug. */
export function journalParams() {
  return JOURNAL_LOCALES.flatMap((locale) =>
    JOURNAL_SLUGS.map((slug) => ({ locale, slug })),
  );
}

/** Locale-less path, the shape `buildOpenGraph` expects. */
export function journalSlugPath(slug?: string): string {
  return slug ? `/journal/${slug}` : "/journal";
}

/** Absolute path, for internal links and the sitemap. */
export function journalPath(locale: string, slug?: string): string {
  return `/${locale}${journalSlugPath(slug)}`;
}

/**
 * Canonical for a Journal page.
 *
 * Self-referencing, with no `languages` map: an hreflang set advertising nine
 * URLs when eight of them 404 tells Google the cluster is broken. Same
 * reasoning as `themePageAlternates`.
 */
export function journalAlternates(locale: string, siteUrl: string, slug?: string) {
  return { canonical: `${siteUrl}${journalPath(locale, slug)}` };
}

/**
 * The related-article slugs to render, filtered to what actually exists.
 *
 * The editorial brief gave every article four "À lire aussi" links, most of
 * them to articles that are not written yet. Shipping those would put four
 * 404s at the foot of every page — the exact mistake the theme pages avoided.
 * A slug that is not in `JOURNAL_SLUGS` is dropped silently here, so the copy
 * can name its ideal neighbours and the page renders only the real ones.
 */
export function publishedRelated(slugs: string[], current: string): JournalSlug[] {
  return slugs.filter(
    (s): s is JournalSlug => s !== current && isJournalSlug(s),
  );
}

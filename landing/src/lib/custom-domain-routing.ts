/**
 * Routing a couple's own domain (spec D6), as pure functions.
 *
 * `proxy.ts` resolves the request's host with `resolve_custom_domain`, then
 * hands the answer to these. They import nothing from `next/*` or
 * `@/navigation` on purpose: the node test runner loads them as they are, and
 * the routing table is the part that must not drift.
 *
 * On a couple's domain the invitation is the site. Their guests read `/`, `/en`
 * and `/jourj/menu`; the slug and the shop's paths never appear. Anything the
 * table does not name is a 404, so the domain cannot be used to browse the shop
 * or to reach another couple's pages.
 */

/** The three pages under the Jour J home, as `app/[locale]/jourj/[slug]/` has them. */
const JOURJ_PAGES = new Set(["ma-table", "menu", "photos"]);

export type CustomDomainRoute =
  /** Serve `path` (an app route). `base` is the locale's prefix on the domain. */
  | { kind: "rewrite"; path: string; locale: string; base: string }
  /** Send the guest to `path`, on the same domain. */
  | { kind: "redirect"; path: string }
  | { kind: "notFound" };

/** What `resolve_custom_domain` said about a host; `null` is "not ours". */
export type CustomDomainResolution =
  | { live: false }
  | { live: true; slug: string; languages: string[] }
  | null;

type LocaleOptions = {
  locales: readonly string[];
  defaultLocale: string;
};

const NOT_FOUND: CustomDomainRoute = { kind: "notFound" };

/**
 * The host as the router compares it: lowercased, without a port and without
 * the fully-qualified trailing dot. `www.` is kept, since it is part of what
 * `isOwnHost` checks; `resolve_custom_domain` strips it on its side.
 */
export function normalizeHost(rawHost: string | null | undefined): string {
  return (rawHost ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

/**
 * True for a host the shop itself answers on, which keeps today's behaviour
 * without a database lookup: the host of `NEXT_PUBLIC_SITE_URL` and its `www.`
 * or apex twin, local development, and Vercel's preview hosts.
 *
 * An empty host counts as ours. A request without one cannot be a couple's
 * domain, and it should not cost a lookup.
 */
export function isOwnHost(
  host: string,
  { siteUrl }: { siteUrl: string | undefined },
): boolean {
  if (!host || host === "localhost" || host === "127.0.0.1") return true;
  if (host.endsWith(".vercel.app")) return true;

  let siteHost = "";
  try {
    siteHost = siteUrl ? normalizeHost(new URL(siteUrl).host) : "";
  } catch {
    // A malformed variable leaves only the fixed hosts above. Any other host
    // then goes to the lookup, which falls through to the shop for a host it
    // does not know: wrong only in that it costs a query.
  }
  if (!siteHost) return false;

  const apex = siteHost.replace(/^www\./, "");
  return host === apex || host === `www.${apex}`;
}

/**
 * Maps a path on a couple's domain to what serves it (spec D6's table).
 *
 * - `/` → the invitation in their first language (`languages[0]`, or the
 *   default locale for a wedding sold before languages were recorded);
 * - `/{L}` with L bought → the invitation in L;
 * - `[/{L}]/jourj` and `[/{L}]/jourj/{ma-table|menu|photos}` → the Jour J;
 * - a locale prefix they did not buy → the same path without it;
 * - anything else → 404.
 *
 * `base` is the locale's prefix on the domain, which links on the page carry:
 * empty for the first language, `/{L}` for the others.
 */
export function mapCustomDomainPath(
  pathname: string,
  {
    slug,
    languages,
    locales,
    defaultLocale,
  }: LocaleOptions & { slug: string; languages: readonly string[] },
): CustomDomainRoute {
  const bought = languages.filter((language) => locales.includes(language));
  const first = bought[0] ?? defaultLocale;
  if (bought.length === 0) bought.push(first);

  // Filtering empty segments is what tolerates a trailing slash.
  const segments = pathname.split("/").filter(Boolean);
  const [prefix, ...rest] = segments;

  if (prefix === undefined || !locales.includes(prefix)) {
    return routeWithin(segments, { slug, locale: first, base: "" });
  }

  if (bought.includes(prefix)) {
    return routeWithin(rest, {
      slug,
      locale: prefix,
      base: prefix === first ? "" : `/${prefix}`,
    });
  }

  // A locale they did not buy: the same page in their first language, at the
  // path without the prefix. A path that would 404 anyway is a 404 now, not a
  // redirect to one.
  const inner = routeWithin(rest, { slug, locale: first, base: "" });
  if (inner.kind !== "rewrite") return inner;
  return { kind: "redirect", path: `/${rest.join("/")}` };
}

/** The table, for the segments after any locale prefix. */
function routeWithin(
  segments: string[],
  { slug, locale, base }: { slug: string; locale: string; base: string },
): CustomDomainRoute {
  const [section, page, extra] = segments;

  if (section === undefined) {
    return { kind: "rewrite", path: `/${locale}/invitation/${slug}`, locale, base };
  }

  if (section !== "jourj" || segments.length > 3) return NOT_FOUND;

  if (page === undefined) {
    return { kind: "rewrite", path: `/${locale}/jourj/${slug}`, locale, base };
  }

  if (extra === undefined && JOURJ_PAGES.has(page)) {
    return {
      kind: "rewrite",
      path: `/${locale}/jourj/${slug}/${page}`,
      locale,
      base,
    };
  }

  // The couple's own slugged path. A theme builds its Jour J links from
  // `dayOf.slug` with next-intl's `Link`, which knows nothing of the domain and
  // produces `/fr/jourj/{slug}/photos`. Sent to the clean path rather than
  // left to 404, so the invitation's own buttons work there. Another couple's
  // slug never matches, so it opens nothing.
  if (page === slug && (extra === undefined || JOURJ_PAGES.has(extra))) {
    return {
      kind: "redirect",
      path: guestHref(extra ?? "", { slug, base, custom: true }),
    };
  }

  return NOT_FOUND;
}

/**
 * What the proxy does once `resolve_custom_domain` has answered: `null` for a
 * host it does not know, which then gets today's behaviour (spec D6 fails open
 * on purpose); a 404 on every path for a known domain that is not live; the
 * table otherwise.
 */
export function routeCustomDomain(
  pathname: string,
  resolution: CustomDomainResolution,
  options: LocaleOptions,
): CustomDomainRoute | null {
  if (resolution === null) return null;
  if (!resolution.live) return NOT_FOUND;

  return mapCustomDomainPath(pathname, {
    ...options,
    slug: resolution.slug,
    languages: resolution.languages,
  });
}

/**
 * A Jour J link, `subpath` being "" for its home or one of its three pages.
 *
 * On a couple's domain it is the clean path, already carrying the locale's
 * `base`, and it is rendered with `next/link`: next-intl's `Link` would add the
 * locale again (`localePrefix` is `'always'`). On the generic link it is
 * today's slugged path, for next-intl's `Link` to prefix.
 */
export function guestHref(
  subpath: string,
  { slug, base, custom }: { slug: string; base: string; custom: boolean },
): string {
  const tail = subpath ? `/${subpath}` : "";
  return custom ? `${base}/jourj${tail}` : `/jourj/${slug}${tail}`;
}

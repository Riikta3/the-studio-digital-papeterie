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

/**
 * Set by `proxy.ts` on a rewrite for a couple's domain, and only there: the
 * proxy deletes any client-sent copy first, so a page can trust them.
 *
 * - `x-custom-domain`: the host the guest typed. Its presence is what tells a
 *   page it is being served on a couple's domain.
 * - `x-custom-domain-base`: the current locale's prefix on that domain, `""`
 *   for the couple's first language, `/en` otherwise.
 */
export const CUSTOM_DOMAIN_HEADER = "x-custom-domain";
export const CUSTOM_DOMAIN_BASE_HEADER = "x-custom-domain-base";

export type CustomDomainRoute =
  /** Serve `path` (an app route). `base` is the locale's prefix on the domain. */
  | { kind: "rewrite"; path: string; locale: string; base: string }
  /** Send the guest to `path`, on the same domain. */
  | { kind: "redirect"; path: string }
  | { kind: "notFound" }
  /** The lookup failed and nothing was cached: a 503, asking to retry. */
  | { kind: "unavailable" };

/**
 * What the proxy knows about a host once it has asked `resolve_custom_domain`:
 *
 * - `live`: a couple's domain to serve, with their slug and languages;
 * - `notLive`: a couple's domain that is not active, or whose site is not
 *   published;
 * - `unknown`: not one of our couples' domains;
 * - `error`: the lookup failed and there was no earlier answer to fall back on.
 */
export type CustomDomainResolution =
  | { kind: "live"; slug: string; languages: string[] }
  | { kind: "notLive" }
  | { kind: "unknown" }
  | { kind: "error" };

type LocaleOptions = {
  locales: readonly string[];
  defaultLocale: string;
};

const NOT_FOUND: CustomDomainRoute = { kind: "notFound" };
const UNAVAILABLE: CustomDomainRoute = { kind: "unavailable" };

const NOT_LIVE: CustomDomainResolution = { kind: "notLive" };
const UNKNOWN: CustomDomainResolution = { kind: "unknown" };
const LOOKUP_ERROR: CustomDomainResolution = { kind: "error" };

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

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

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
  if (!host || LOCAL_HOSTS.has(host)) return true;
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
 * Whether a page must wear a couple's domain's chrome rather than the shop's:
 * the bare 404 instead of `NotFoundView`, and no `ContactBubble` or
 * `CookieConsent`. Read by `isCoupleDomainRequest()` in the app.
 *
 * True when the proxy stamped the request, and also when the host is simply
 * not ours. The second half is for the paths the proxy never sees: the
 * matcher skips any path with a dot, so `/fr/studio/.` on a couple's domain
 * reaches the app unstamped, and used to render the shop's 404 with its links.
 * Deciding from the host costs no database call.
 *
 * The price: a host of the shop's that `isOwnHost` does not list (an alias we
 * forgot) gets the bare 404, and no contact bubble or cookie banner. Only 404s
 * and chrome, never a working page, which the proxy serves as before.
 */
export function isCoupleDomainChrome(
  headers: { get(name: string): string | null },
  { siteUrl }: { siteUrl: string | undefined },
): boolean {
  if (headers.get(CUSTOM_DOMAIN_HEADER)) return true;
  return !isOwnHost(normalizeHost(headers.get("host")), { siteUrl });
}

/**
 * Maps a path on a couple's domain to what serves it (spec D6's table).
 *
 * - `/` → the invitation in their first language (`languages[0]`, or the
 *   default locale for a wedding sold before languages were recorded);
 * - `/{L}` with L bought → the invitation in L;
 * - `[/{L}]/jourj` and `[/{L}]/jourj/{ma-table|menu|photos}` → the Jour J;
 * - a locale prefix they did not buy → the same path without it;
 * - their own slugged Jour J path (`/fr/jourj/{slug}/photos`, which a theme's
 *   next-intl `Link` produces) → its clean path;
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

/** One row of `resolve_custom_domain`, as PostgREST returns it. */
type ResolverRow = {
  live: boolean | null;
  slug: string | null;
  languages: string[] | null;
};

/**
 * `resolve_custom_domain`'s rows as the proxy reads them. No row is a host
 * that is not one of our couples' domains. A live row without a slug cannot be
 * served, so it is answered like a domain that is not live: a 404, rather than
 * the shop on a host that is known to be a couple's.
 */
export function toCustomDomainResolution(
  rows: readonly ResolverRow[] | null | undefined,
): CustomDomainResolution {
  const row = rows?.[0];
  if (!row) return UNKNOWN;
  if (row.live !== true || !row.slug) return NOT_LIVE;
  return { kind: "live", slug: row.slug, languages: row.languages ?? [] };
}

/**
 * What the proxy does once `resolve_custom_domain` has answered:
 *
 * - `null` for a host it does not know, which then gets today's behaviour
 *   (spec D6 fails open on purpose: an alias of the shop we forgot to list
 *   must not 404 the whole site);
 * - a 503 when the lookup failed with nothing cached. It does not fail open
 *   there: the host may well be a couple's, and serving it the shop would put
 *   our front page on their domain;
 * - a 404 on every path for a known domain that is not live;
 * - the table otherwise.
 */
export function routeCustomDomain(
  pathname: string,
  resolution: CustomDomainResolution,
  options: LocaleOptions,
): CustomDomainRoute | null {
  switch (resolution.kind) {
    case "unknown":
      return null;
    case "error":
      return UNAVAILABLE;
    case "notLive":
      return NOT_FOUND;
    case "live":
      return mapCustomDomainPath(pathname, {
        ...options,
        slug: resolution.slug,
        languages: resolution.languages,
      });
  }
}

/** `resolve_custom_domain` as the resolver calls it, with an abort signal. */
export type CustomDomainRpc = (
  host: string,
  signal: AbortSignal,
) => PromiseLike<{ data: readonly ResolverRow[] | null; error: unknown }>;

/**
 * `resolve_custom_domain` behind a per-instance cache (spec D6): what the
 * proxy calls for every host that is not ours.
 *
 * - A live answer is kept `liveTtlMs` (a minute), any other `otherTtlMs` (ten
 *   seconds), so a domain that has just gone live is reachable by the time the
 *   couple clicks the « en ligne » email.
 * - A lookup is given up after `timeoutMs`, and its call aborted.
 * - A failed lookup never takes the request down. It answers with the last
 *   real answer for that host if there is one, expired or not, and otherwise
 *   `error`. Either is kept `otherTtlMs`, so an outage costs one query per
 *   host per ten seconds rather than one per request.
 * - At most `max` hosts are kept. On Vercel only the hosts attached to the
 *   project arrive here, but anywhere else the Host header is whatever the
 *   client sends. When full, expired entries go first, then the least
 *   recently used: a hit moves its host to the back.
 *
 * Never throws. `onError` hears about every failed lookup.
 */
export function createCustomDomainResolver({
  rpc,
  now,
  max,
  liveTtlMs,
  otherTtlMs,
  timeoutMs,
  onError,
}: {
  rpc: CustomDomainRpc;
  now: () => number;
  max: number;
  liveTtlMs: number;
  otherTtlMs: number;
  timeoutMs: number;
  onError?: (host: string, error: unknown) => void;
}): { resolve(host: string): Promise<CustomDomainResolution> } {
  // A Map iterates in insertion order, which is what makes it an LRU: a
  // `delete` then `set` moves a host to the back, and the front is the least
  // recently used.
  const cache = new Map<
    string,
    { resolution: CustomDomainResolution; expiresAt: number }
  >();

  function remember(
    host: string,
    resolution: CustomDomainResolution,
    expiresAt: number,
  ) {
    cache.delete(host);
    if (cache.size >= max) {
      const t = now();
      for (const [key, entry] of cache) {
        if (entry.expiresAt <= t) cache.delete(key);
      }
    }
    while (cache.size >= max) {
      const oldest = cache.keys().next().value;
      if (oldest === undefined) break;
      cache.delete(oldest);
    }
    cache.set(host, { resolution, expiresAt });
  }

  async function resolve(host: string): Promise<CustomDomainResolution> {
    const t = now();
    const cached = cache.get(host);
    if (cached && cached.expiresAt > t) {
      cache.delete(host);
      cache.set(host, cached);
      return cached.resolution;
    }

    try {
      const { data, error } = await withTimeout(
        (signal) => rpc(host, signal),
        timeoutMs,
      );
      if (error) throw error;

      const resolution = toCustomDomainResolution(data);
      remember(
        host,
        resolution,
        t + (resolution.kind === "live" ? liveTtlMs : otherTtlMs),
      );
      return resolution;
    } catch (error) {
      onError?.(host, error);
      const fallback = cached?.resolution ?? LOOKUP_ERROR;
      remember(host, fallback, t + otherTtlMs);
      return fallback;
    }
  }

  return { resolve };
}

/**
 * `run`'s promise, rejected after `ms` with its signal aborted. Raced rather
 * than left to the signal alone, so a call that ignores its signal cannot hang
 * the request either.
 */
function withTimeout<T>(
  run: (signal: AbortSignal) => PromiseLike<T>,
  ms: number,
): Promise<T> {
  const controller = new AbortController();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = new Error(`resolve_custom_domain timed out after ${ms} ms`);
      controller.abort(error);
      reject(error);
    }, ms);
    Promise.resolve()
      .then(() => run(controller.signal))
      .then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error);
        },
      );
  });
}

/**
 * The rewrite's request headers (spec D6). Overriding a rewrite's request
 * headers replaces ALL of them, so this starts from a copy of the incoming
 * ones, then sets:
 *
 * - `X-NEXT-INTL-LOCALE`: next-intl reads the locale from this header (or
 *   `setRequestLocale`), never from the `[locale]` segment. Without it the
 *   page renders in French;
 * - `x-pathname`: the rewritten path, which the root layout derives
 *   `<html lang dir>` from;
 * - `x-custom-domain` and `x-custom-domain-base`, which the pages read.
 */
export function customDomainRequestHeaders(
  baseHeaders: Headers,
  {
    host,
    locale,
    rewrittenPath,
    base,
  }: { host: string; locale: string; rewrittenPath: string; base: string },
): Headers {
  const headers = new Headers(baseHeaders);
  headers.set("X-NEXT-INTL-LOCALE", locale);
  headers.set("x-pathname", rewrittenPath);
  headers.set(CUSTOM_DOMAIN_HEADER, host);
  headers.set(CUSTOM_DOMAIN_BASE_HEADER, base);
  return headers;
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

/*
 * The bare pages a couple's domain answers with when it cannot show the
 * invitation. Never the app's `NotFoundView`, which carries the shop's menu,
 * language switcher and studio links, none of which belong on a couple's
 * domain (and none of which would work there). French only, like the rest of
 * the guest pages' fixed copy.
 *
 * The 404 exists twice, from the same copy and the same stylesheet:
 * - as the HTML string below, which the proxy answers with itself (a known
 *   domain that is not live, a path outside the table). No link, no script, no
 *   asset: it must render even when nothing else does;
 * - as `CustomDomainNotFound`, which the app's two `not-found.tsx` render when
 *   a page the proxy rewrote calls `notFound()`, or for a path the proxy never
 *   saw. A not-found file must return JSX, so it cannot send this string.
 */

/** What a bare page says. `eyebrow` above the title, `note` below the rule. */
export type BarePageCopy = { eyebrow?: string; title: string; note?: string };

export const CUSTOM_DOMAIN_NOT_FOUND_COPY = {
  eyebrow: "404",
  title: "Page introuvable",
} as const satisfies BarePageCopy;

export const CUSTOM_DOMAIN_UNAVAILABLE_COPY = {
  title: "Un instant…",
  note: "Réessayez dans quelques secondes.",
} as const satisfies BarePageCopy;

/** The class on a bare page's `<main>`, which every rule below is scoped to. */
export const BARE_PAGE_CLASS = "couple-domain-bare";

/**
 * The bare pages' look, for the proxy's `<style>` and the app's alike. Every
 * element's font is set rather than inherited: in the app, `globals.css` gives
 * every heading the shop's display face.
 */
export const BARE_PAGE_CSS = [
  `.${BARE_PAGE_CLASS}{min-height:100vh;min-height:100svh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#fdfbf7;color:#3a3530;text-align:center}`,
  `.${BARE_PAGE_CLASS} p{margin:0 0 14px;font:500 11px/1 system-ui,-apple-system,sans-serif;letter-spacing:.28em;text-transform:uppercase;opacity:.45}`,
  `.${BARE_PAGE_CLASS} h1{margin:0;font:400 clamp(28px,7vw,40px)/1.2 Georgia,"Times New Roman",serif;letter-spacing:.01em}`,
  `.${BARE_PAGE_CLASS} hr{width:40px;margin:22px auto 0;border:0;border-top:1px solid currentColor;opacity:.25}`,
  `.${BARE_PAGE_CLASS} p.note{margin:22px 0 0;font:400 15px/1.5 system-ui,-apple-system,sans-serif;letter-spacing:0;text-transform:none;opacity:.7}`,
].join("\n");

function barePageHtml({ eyebrow, title, note }: BarePageCopy): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
html,body{margin:0}
${BARE_PAGE_CSS}
</style>
</head>
<body>
<main class="${BARE_PAGE_CLASS}">
<div>
${eyebrow ? `<p>${eyebrow}</p>\n` : ""}<h1>${title}</h1>
<hr>
${note ? `<p class="note">${note}</p>\n` : ""}</div>
</main>
</body>
</html>
`;
}

/** The proxy's 404 on a couple's domain. */
export const CUSTOM_DOMAIN_NOT_FOUND_HTML = barePageHtml(
  CUSTOM_DOMAIN_NOT_FOUND_COPY,
);

/**
 * The proxy's 503 on a couple's domain: the lookup failed and nothing was
 * cached for the host. Sent with `Retry-After` and `Cache-Control: no-store`.
 */
export const CUSTOM_DOMAIN_UNAVAILABLE_HTML = barePageHtml(
  CUSTOM_DOMAIN_UNAVAILABLE_COPY,
);

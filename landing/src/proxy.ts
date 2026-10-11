import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  CUSTOM_DOMAIN_BASE_HEADER,
  CUSTOM_DOMAIN_HEADER,
  CUSTOM_DOMAIN_NOT_FOUND_HTML,
  CUSTOM_DOMAIN_UNAVAILABLE_HTML,
  type CustomDomainRoute,
  createCustomDomainResolver,
  customDomainRequestHeaders,
  isOwnHost,
  normalizeHost,
  routeCustomDomain,
} from "@/lib/custom-domain-routing";
import { supabaseAnon } from "@/lib/supabase-anon";

import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

/** Read once: `NEXT_PUBLIC_*` is fixed at build time anyway. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

/**
 * How long anything but a live answer is kept, a failed lookup included.
 * Also the 503's `Retry-After`: by then this instance asks the database again.
 */
const OTHER_TTL_MS = 10_000;

const ERROR_LOG_INTERVAL_MS = 60_000;
let lastErrorLoggedAt = Number.NEGATIVE_INFINITY;

/**
 * `resolve_custom_domain` for this server instance, cached (spec D6): a live
 * domain a minute, anything else ten seconds. See `createCustomDomainResolver`
 * for the timeout, the stale answers and the bound.
 */
const customDomains = createCustomDomainResolver({
  rpc: (host, signal) =>
    supabaseAnon
      .rpc("resolve_custom_domain", { p_host: host })
      .abortSignal(signal),
  now: Date.now,
  max: 1_000,
  liveTtlMs: 60_000,
  otherTtlMs: OTHER_TTL_MS,
  timeoutMs: 3_000,
  // At most once a minute per instance: a database outage would otherwise log
  // for every couple's domain every ten seconds.
  onError: (host, error) => {
    const now = Date.now();
    if (now - lastErrorLoggedAt < ERROR_LOG_INTERVAL_MS) return;
    lastErrorLoggedAt = now;
    console.error("[CUSTOM_DOMAIN_RESOLVE]", host, error);
  },
});

/**
 * Answers a request on a couple's domain, entirely here: next-intl's
 * middleware is never called for it, because it would redirect `/` to `/fr`
 * and re-prefix every rewrite.
 */
function answerCustomDomain(
  request: NextRequest,
  host: string,
  route: CustomDomainRoute,
): NextResponse {
  // From the proxy itself, never `not-found.tsx`: the app's 404 carries the
  // shop's menu and links.
  if (route.kind === "notFound") {
    return new NextResponse(CUSTOM_DOMAIN_NOT_FOUND_HTML, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  // The lookup failed and this instance had no answer for the host. It may
  // well be a couple's, so the shop is not served there; the guest is asked
  // to try again once the failed answer has expired.
  if (route.kind === "unavailable") {
    return new NextResponse(CUSTOM_DOMAIN_UNAVAILABLE_HTML, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "retry-after": String(OTHER_TTL_MS / 1_000),
        "cache-control": "no-store",
      },
    });
  }

  // A clone keeps the query string, as next-intl's own redirects do.
  const url = request.nextUrl.clone();
  url.pathname = route.path;

  if (route.kind === "redirect") return NextResponse.redirect(url, 307);

  const headers = customDomainRequestHeaders(request.headers, {
    host,
    locale: route.locale,
    rewrittenPath: route.path,
    base: route.base,
  });

  return NextResponse.rewrite(url, { request: { headers } });
}

/**
 * The two sitemap URLs a crawler guesses when the real one is /sitemap.xml.
 *
 * Next generates only /sitemap.xml from `app/sitemap.ts`, but these are the
 * conventional names (next-sitemap emits them, and Search Console suggests
 * them), so they get requested. They matched no route, and because the matcher
 * used to skip any path containing a dot they never reached the router either
 * — they rendered the FRENCH HOMEPAGE with a 200. A crawler asking for a
 * sitemap and receiving a duplicate homepage is the worst possible answer, so
 * they are answered explicitly here.
 *
 * Kept to a fixed list rather than a general "does this path have an
 * extension" rule: such a rule cannot tell a missing file from a real one in
 * public/ (the middleware runs BEFORE static assets are served, so /logo.svg
 * arrives here too) and 404s every asset on the site.
 */
const GUESSED_SITEMAPS = new Set(["/sitemap-0.xml", "/sitemap_index.xml"]);

/**
 * What stays reachable while the site is closed for launch.
 *
 * Maintenance mode used to send every path to /coming-soon, which is right for
 * the shop front and wrong for what a couple has already bought: their
 * invitation lives here, and the whole product is a link they send to their
 * guests. A couple who paid before the public launch could not share anything
 * — the link in their own dashboard bounced to a "coming soon" page.
 *
 * These three are the guest-facing pages, and every one of them is addressed
 * by a slug generated with a random suffix (`generateSlug` in
 * `actions/create-wedding.ts`). They are unguessable and carry no way into the
 * shop, so opening them does not open the launch.
 *
 * The marketing pages under `(landing)/[slug]` are deliberately NOT here: they
 * are part of the site being held back.
 */
const GUEST_PREFIXES = ["/invitation/", "/jourj/", "/journal/"];

/** True for a guest page, with or without its locale prefix. */
function isGuestPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const withoutLocale = (routing.locales as readonly string[]).includes(
    segments[0],
  )
    ? "/" + segments.slice(1).join("/")
    : pathname;

  // The trailing slash in each prefix is what requires a slug after it, so
  // `/invitation` on its own still goes to /coming-soon.
  return GUEST_PREFIXES.some((prefix) => withoutLocale.startsWith(prefix));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only the proxy may say a request came in on a couple's domain: pages hide
  // the shop's chrome and change their links on these headers. Deleted on
  // every host, so a client-sent copy never reaches a page.
  request.headers.delete(CUSTOM_DOMAIN_HEADER);
  request.headers.delete(CUSTOM_DOMAIN_BASE_HEADER);

  // A couple's domain (spec D6). Our own hosts skip this without a database
  // call, so a lookup failure never touches them. A host the resolver does
  // not know falls through to the shop, on purpose: an alias of ours we
  // forgot to list must not 404 the whole site, and Vercel only routes hosts
  // attached to the project anyway. A failed lookup with nothing cached is a
  // 503 instead. Maintenance mode below never applies on a couple's domain.
  const host = normalizeHost(request.headers.get("host"));
  if (!isOwnHost(host, { siteUrl: SITE_URL })) {
    const route = routeCustomDomain(
      pathname,
      await customDomains.resolve(host),
      { locales: routing.locales, defaultLocale: routing.defaultLocale },
    );
    if (route) return answerCustomDomain(request, host, route);
  }

  // Point the guessed sitemap names at the real one instead of letting them
  // fall through to a 200 homepage. A permanent redirect rather than a 404:
  // the resource genuinely exists, just under the name Next gives it, so a
  // crawler that guessed follows the redirect and reads the sitemap.
  if (GUESSED_SITEMAPS.has(pathname)) {
    return NextResponse.redirect(new URL("/sitemap.xml", request.url), 308);
  }

  // Redirect /coming-soon → / when maintenance mode is off
  if (process.env.MAINTENANCE_MODE !== "true" && pathname.endsWith("/coming-soon")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Maintenance mode redirect — MAINTENANCE_MODE is baked at build time, toggling requires a redeploy
  if (process.env.MAINTENANCE_MODE === "true" && !isGuestPath(pathname)) {
    const segments = pathname.split("/").filter(Boolean);
    const locale = (routing.locales as readonly string[]).includes(segments[0])
      ? segments[0]
      : routing.defaultLocale;
    const target = `/${locale}/coming-soon`;

    if (pathname !== target) {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // The root `not-found.tsx` renders for unmatched localized URLs too, and has
  // no params to read the locale from — forward the path so it can.
  request.headers.set("x-pathname", pathname);

  return intlMiddleware(request);
}

export const config = {
  // Everything except Next internals, the API routes and files with an
  // extension, so unknown paths without a locale prefix (e.g. /foobar) still
  // go through next-intl and land on the localized 404 with a 404 status.
  //
  // The two guessed sitemap names are added back explicitly: they carry an
  // extension, so the exclusion would skip the middleware and let them render
  // the homepage with a 200. Dropping the extension exclusion entirely is not
  // an option — the middleware runs before static assets are served, so every
  // real file in public/ would be routed through next-intl and 404.
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    "/sitemap-0.xml",
    "/sitemap_index.xml",
  ],
};

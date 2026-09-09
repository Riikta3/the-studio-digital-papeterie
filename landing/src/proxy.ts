import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

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

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  if (process.env.MAINTENANCE_MODE === "true") {
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

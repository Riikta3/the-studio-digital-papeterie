import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

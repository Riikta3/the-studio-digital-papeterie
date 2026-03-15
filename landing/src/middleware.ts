// landing/src/middleware.ts
// Note: this project uses next-intl via createNextIntlPlugin (next.config.mjs),
// NOT via createMiddleware. This middleware only handles maintenance mode redirect.
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./navigation";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exempt: API routes, _next internals, static files (contain a dot)
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

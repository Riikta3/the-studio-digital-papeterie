// landing/src/middleware.ts
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];

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

  // Maintenance mode redirect
  if (process.env.MAINTENANCE_MODE === "true") {
    const segments = pathname.split("/").filter(Boolean);
    const locale = LOCALES.includes(segments[0]) ? segments[0] : "fr";
    const target = `/${locale}/coming-soon`;

    if (!pathname.endsWith("/coming-soon")) {
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

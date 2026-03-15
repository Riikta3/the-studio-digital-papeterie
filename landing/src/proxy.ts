import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(fr|en|de|es|pt|it|ar|zh|ja)/:path*"],
};

import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./navigation";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  // The root `not-found.tsx` renders for unmatched localized URLs too, and has
  // no params to read the locale from — forward the path so it can.
  request.headers.set("x-pathname", request.nextUrl.pathname);

  return intlMiddleware(request);
}

export const config = {
  // Everything except Next internals, files with an extension, and the routes
  // that deliberately live outside `[locale]` — `api`, plus Supabase's email
  // confirmation (`auth/confirm`) and `update-password`, which next-intl would
  // otherwise redirect to a locale-prefixed path that does not exist, breaking
  // sign-up confirmation.
  //
  // Everything else goes through next-intl so that an unknown path without a
  // locale prefix (e.g. /foobar) still lands on the localized 404 with a real
  // 404 status, instead of bypassing the middleware and answering 200.
  matcher: [
    "/((?!api|auth|update-password|_next|_vercel|.*\\..*).*)",
  ],
};

import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./navigation";
import { updateSession } from "./utils/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/**
 * `/fr/update-password` and friends. The page lives outside `[locale]`, but
 * reset emails used to send `next=/<locale>/update-password` — a 404 reached
 * AFTER the recovery link had signed the couple in, so they landed in the
 * dashboard without ever being asked for a new password. Links already in
 * inboxes stay valid for a day, so this redirect has to catch them.
 */
const LOCALIZED_UPDATE_PASSWORD = new RegExp(
  `^/(${routing.locales.join("|")})/update-password/?$`,
);

export default async function proxy(request: NextRequest) {
  const localized = request.nextUrl.pathname.match(LOCALIZED_UPDATE_PASSWORD);
  if (localized) {
    const target = request.nextUrl.clone();
    target.pathname = "/update-password";
    target.searchParams.set("locale", localized[1]);
    return NextResponse.redirect(target);
  }

  // Auth first: `updateSession` either redirects an anonymous visitor to
  // /<locale>/login or refreshes their token. It had never been wired in —
  // the function existed but nothing imported it — so until now no dashboard
  // route was checked before rendering. Running it here also means the
  // refreshed auth cookies are set on every request, not only on the ones that
  // happen to touch a server action.
  const authResponse = await updateSession(request);

  // A redirect is final; handing it to next-intl would lose it.
  if (authResponse.headers.get("location")) {
    return authResponse;
  }

  // The root `not-found.tsx` renders for unmatched localized URLs too, and has
  // no params to read the locale from — forward the path so it can.
  request.headers.set("x-pathname", request.nextUrl.pathname);

  const intlResponse = intlMiddleware(request);

  // Carry over the session cookies `updateSession` just refreshed: the
  // response next-intl builds is a different object and does not have them, so
  // without this the token is refreshed and then thrown away, signing the
  // couple out as soon as the old one expires.
  authResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie);
  });

  return intlResponse;
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

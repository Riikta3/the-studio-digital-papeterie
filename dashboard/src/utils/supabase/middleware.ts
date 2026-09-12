import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/navigation";

/**
 * Routes reachable without a session, matched after the locale prefix is
 * stripped. Everything else in the dashboard requires one.
 *
 * `/rsvp` is the guest-facing RSVP screen — the one deliberately public page
 * this app serves (see `actions/rsvp-actions.ts`). Protecting it would lock
 * out every wedding guest, so it is listed here on purpose, and its own
 * security comes from the security-definer RPCs behind it rather than from a
 * session.
 */
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/rsvp",
];

/**
 * How long a session survives with no activity, enforced in this file.
 *
 * Supabase's own `[auth.sessions] inactivity_timeout` does the same thing at
 * the source — and revokes the refresh token, which this cannot — but it is
 * only available on paid plans. The value here and the one in
 * `supabase/config.toml` describe the same intent; whichever applies, the
 * couple sees the same 30 days.
 *
 * 30 days rather than a week: a wedding is prepared over 6 to 18 months in
 * bursts, and signing back in costs an email round trip because the flow is
 * passwordless.
 */
const IDLE_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

/** Timestamp of the last authenticated request, refreshed on every visit. */
const LAST_SEEN_COOKIE = "sb-last-seen";

/** The locale a path is under, falling back to the default. */
function localeOf(pathname: string): string {
  const [first] = pathname.split("/").filter(Boolean);

  return (routing.locales as readonly string[]).includes(first)
    ? first
    : routing.defaultLocale;
}

/** Strips a leading `/fr`, `/en`, … so one list covers all nine locales. */
function pathWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const [first, ...rest] = segments;

  if ((routing.locales as readonly string[]).includes(first)) {
    return "/" + rest.join("/");
  }

  return pathname;
}

function isPublicPath(pathname: string): boolean {
  const path = pathWithoutLocale(pathname);

  // `/rsvp` must not swallow `/rsvp-responses`, which is the couple's own
  // screen and stays behind the session — hence the exact-or-subpath test
  // rather than a bare `startsWith`.
  return PUBLIC_PATHS.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`),
  );
}

/**
 * Refreshes the Supabase session and turns away anonymous callers.
 *
 * This function has existed since the project was scaffolded but was never
 * imported anywhere: there was no root middleware, and `proxy.ts` (the Next 16
 * name for it) only ran next-intl. So no dashboard route was ever checked at
 * the edge. What stood in for it, `DashboardLayout`, is a client component
 * whose `isAuthenticated` state hides the sidebar — it cannot keep anyone out.
 *
 * Every page still fetches through `requireWedding()`, which does validate the
 * JWT, so this is not the only thing standing between a stranger and the
 * couple's data. What it adds is the redirect to `/login` instead of an error
 * boundary, and a refreshed token on every request.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error(
      "❌ CRITICAL: Missing Supabase Environment Variables in Middleware",
    );
    throw new Error("Missing Supabase Environment Variables");
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // `getUser()` rather than `getSession()`: only this one validates the JWT
  // against the auth server. It also refreshes the token, and the cookies it
  // sets must be carried on the response returned below.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Idle expiry, enforced here because Supabase's own
  // `[auth.sessions] inactivity_timeout` is a paid feature. Without it a
  // refresh token never expires, so a session signed in once stays valid for
  // ever and nobody is ever signed out.
  //
  // This is a convenience boundary, not a security one: the cookie below is
  // set by us and could be forged, and the underlying Supabase session stays
  // valid until it is explicitly signed out. What it buys is the behaviour
  // couples expect — a laptop left at a venue does not stay signed in
  // indefinitely — and it costs nothing.
  if (user) {
    const seen = request.cookies.get(LAST_SEEN_COOKIE)?.value;
    const lastSeen = seen ? Number(seen) : NaN;
    const now = Date.now();

    // A session older than the window is ended here rather than merely
    // redirected: signing out revokes the refresh token, so the browser cannot
    // simply drop our cookie and carry on with the Supabase session it holds.
    if (Number.isFinite(lastSeen) && now - lastSeen > IDLE_TIMEOUT_MS) {
      await supabase.auth.signOut();

      const url = request.nextUrl.clone();
      url.pathname = `/${localeOf(request.nextUrl.pathname)}/login`;
      url.search = "?reason=expired";

      const response = NextResponse.redirect(url);
      response.cookies.delete(LAST_SEEN_COOKIE);
      return response;
    }

    // Touched on every authenticated request, which is what makes the window
    // slide: the clock restarts each time the couple comes back.
    supabaseResponse.cookies.set(LAST_SEEN_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: IDLE_TIMEOUT_MS / 1000,
    });
  }

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();

    // Keep the locale the visitor was browsing, so a German couple lands on
    // /de/login rather than being dropped into the default locale.
    url.pathname = `/${localeOf(request.nextUrl.pathname)}/login`;

    // So the login page can send them back where they were headed. Only the
    // path and query are kept — never an absolute URL, which would turn this
    // into an open redirect.
    const target = request.nextUrl.pathname + request.nextUrl.search;
    url.search = `?next=${encodeURIComponent(target)}`;

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

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

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();

    // Keep the locale the visitor was browsing, so a German couple lands on
    // /de/login rather than being dropped into the default locale.
    const segments = request.nextUrl.pathname.split("/").filter(Boolean);
    const locale = (routing.locales as readonly string[]).includes(segments[0])
      ? segments[0]
      : routing.defaultLocale;

    url.pathname = `/${locale}/login`;

    // So the login page can send them back where they were headed. Only the
    // path and query are kept — never an absolute URL, which would turn this
    // into an open redirect.
    const target = request.nextUrl.pathname + request.nextUrl.search;
    url.search = `?next=${encodeURIComponent(target)}`;

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

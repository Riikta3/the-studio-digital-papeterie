import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/update-password";

  if (token_hash && type) {
    const redirectTo = request.nextUrl.clone();
    const nextUrl = new URL(next, request.nextUrl.origin);
    redirectTo.pathname = nextUrl.pathname;
    redirectTo.search = nextUrl.search;
    redirectTo.searchParams.delete("token_hash");
    redirectTo.searchParams.delete("type");

    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return response;
    }
  }

  // If no token_hash (PKCE Code Flow)
  const code = searchParams.get("code");
  if (code) {
    const redirectTo = request.nextUrl.clone();
    const nextUrl = new URL(next, request.nextUrl.origin);
    redirectTo.pathname = nextUrl.pathname;
    redirectTo.search = nextUrl.search;
    redirectTo.searchParams.delete("code");

    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // Check if Supabase returned an error directly (e.g. link expired)
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const error_code = searchParams.get("error_code");

  if (error) {
    const redirectTo = request.nextUrl.clone();
    redirectTo.pathname = "/login";
    redirectTo.searchParams.set("error", error_code || error);
    if (error_description) {
      redirectTo.searchParams.set("error_description", error_description);
    }
    return NextResponse.redirect(redirectTo);
  }

  /*
   * Nothing usable in the query — which is the NORMAL case for the magic
   * link sent after checkout, not a failure.
   *
   * `generateLink({type: "magiclink"})` uses Supabase's implicit flow, and
   * that returns the session in the URL fragment:
   *   /auth/confirm?next=/fr#access_token=…&refresh_token=…
   *
   * A fragment is never sent to the server. This handler therefore saw an
   * empty query, found neither `token_hash` nor `code`, and used to answer
   * `auth_failed` — sending a couple who had just paid to the login page,
   * from a link whose own text promises to sign them in without a password.
   *
   * The browser is the only place that can read those tokens, so hand the
   * request to a page that runs there. The fragment survives a redirect on
   * its own: the browser re-attaches it to the new location, so it does not
   * need to be — and must not be — copied into the query string, where it
   * would land in server logs and in the referrer of every later request.
   */
  /*
   * Only when the query held nothing to verify. A `token_hash` or `code`
   * that WAS present and failed is a spent or forged link, not an implicit
   * flow — sending it here would bounce it through the browser and report
   * the same failure one redirect later, after telling the couple we were
   * signing them in.
   */
  if (!token_hash && !searchParams.get("code")) {
    const handoff = request.nextUrl.clone();
    handoff.pathname = "/auth/session";
    handoff.search = `?next=${encodeURIComponent(next)}`;

    return NextResponse.redirect(handoff);
  }

  // A credential was supplied and did not check out.
  const failed = request.nextUrl.clone();
  failed.pathname = "/login";
  failed.search = "?error=invalid_link";

  return NextResponse.redirect(failed);
}

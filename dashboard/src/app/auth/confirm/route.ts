import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/update-password";

  if (token_hash && type) {
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
              request.cookies.set(name, value),
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
      const redirectTo = request.nextUrl.clone();
      const nextUrl = new URL(next, request.nextUrl.origin);
      redirectTo.pathname = nextUrl.pathname;
      redirectTo.search = nextUrl.search;
      redirectTo.searchParams.delete("token_hash");
      redirectTo.searchParams.delete("type");
      return NextResponse.redirect(redirectTo);
    }
  }

  // If no token_hash (PKCE Code Flow)
  const code = searchParams.get("code");
  if (code) {
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
              request.cookies.set(name, value),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectTo = request.nextUrl.clone();
      const nextUrl = new URL(next, request.nextUrl.origin);
      redirectTo.pathname = nextUrl.pathname;
      redirectTo.search = nextUrl.search;
      redirectTo.searchParams.delete("code");
      return NextResponse.redirect(redirectTo);
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

  // Auth failed -> Redirect to login with generic error
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "auth_failed");
  return NextResponse.redirect(redirectTo);
}

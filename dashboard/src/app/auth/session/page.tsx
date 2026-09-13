"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/utils/supabase/client";

/**
 * Completes a sign-in whose tokens arrived in the URL fragment.
 *
 * Supabase's implicit flow — the one `generateLink({type: "magiclink"})`
 * produces — hands the session back as `#access_token=…&refresh_token=…`.
 * A fragment is never sent to the server, so `/auth/confirm` (a Route
 * Handler) saw an empty query, found neither `token_hash` nor `code`, and
 * fell through to its `auth_failed` branch. The couple clicked "this link
 * signs you in without a password" and landed on the login page.
 *
 * This page runs in the browser, where the fragment is readable. It hands
 * the pair to `setSession()`, which validates them against the auth server
 * and — through the SSR browser client — writes the same cookies the rest
 * of the app reads, so the session survives the redirect that follows.
 *
 * Why a separate route rather than a fix inside `/auth/confirm`: a path can
 * be either a Route Handler or a page, never both, and the existing handler
 * still serves the two flows that DO reach the server (`token_hash` and
 * PKCE). It redirects here only when it has nothing to work with.
 *
 * The tokens never leave the browser: they are read from `location.hash`,
 * passed straight to the Supabase client, and the fragment is wiped from
 * history before anything else runs. Nothing is logged, and nothing is put
 * in a query string, where it would reach our server logs and the referrer
 * of every subsequent request.
 */

/** Paths we will send a freshly signed-in couple to. */
function safeNext(raw: string | null): string {
  if (!raw) return "/";

  // Only a path within this app. `next` comes off the URL, so without this a
  // crafted link could sign someone in and then hand them to another site
  // with a valid session in hand.
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/";

  return raw;
}

type Status = "working" | "failed";

export default function AuthSessionPage() {
  const [status, setStatus] = useState<Status>("working");

  // React runs effects twice in development, and `setSession` consumes a
  // single-use token — without this the second pass reports a failure for a
  // sign-in that actually succeeded.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const fragment = new URLSearchParams(hash);
      const query = new URLSearchParams(window.location.search);

      const next = safeNext(query.get("next"));

      /*
       * Clear the fragment before doing anything with it. It holds a usable
       * refresh token, and leaving it in the address bar puts it in browser
       * history and in anything the couple copies out of that bar.
       */
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );

      // Supabase reports a refused link here rather than through an error
      // from setSession, so this branch is the expired/already-used case.
      const fragmentError = fragment.get("error_description")
        ? "expired"
        : fragment.get("error");

      const accessToken = fragment.get("access_token");
      const refreshToken = fragment.get("refresh_token");

      if (fragmentError || !accessToken || !refreshToken) {
        // `invalid_link` is the reason code the login page already explains
        // with a toast, so an expired link reads the same however it failed.
        window.location.replace("/login?error=invalid_link");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        // Deliberately not logged: the message can carry token material, and
        // this runs in the couple's browser where a console is one click away.
        setStatus("failed");
        window.location.replace("/login?error=invalid_link");
        return;
      }

      /*
       * `replace`, not `push`: Back must not return to a page whose only
       * purpose was to consume a token that no longer works.
       *
       * A full navigation rather than the router, so the server components
       * behind `next` are rendered with the cookies just written.
       */
      window.location.replace(next);
    })();
  }, []);

  return (
    <main className='flex min-h-screen items-center justify-center bg-studio-creme p-6'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <div
          className='h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary'
          role='status'
          aria-label='Connexion en cours'
        />
        <p className='font-body text-sm text-gray-500'>
          {status === "working"
            ? "Connexion à votre espace…"
            : "Redirection…"}
        </p>
      </div>
    </main>
  );
}

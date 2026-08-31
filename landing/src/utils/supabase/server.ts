import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components and Server Actions.
 *
 * Uses the ANON key, so every query goes through Row Level Security. This is
 * the client public-facing writes must use: the invitation pages are open to
 * anyone with the link, and `supabaseAdmin` (SERVICE_ROLE) would let a crafted
 * payload write anywhere in the database. The public `insert` policies on
 * `rsvp_responses` and `playlist_suggestions` exist precisely so guests can
 * submit without an account.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component: cookies are read-only there.
            // Session refresh is the middleware's job, so this is safe to skip.
          }
        },
      },
    },
  );
}

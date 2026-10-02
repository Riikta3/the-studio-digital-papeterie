import { createClient } from "@supabase/supabase-js";

// Cookie-less ANON client, for code that runs without a request's cookies.
//
// `proxy.ts` resolves a couple's domain on every request to that host, before
// any route runs. `utils/supabase/server.ts` reads `cookies()` from
// `next/headers`, which the proxy cannot call, and the service role has no
// business there: `resolve_custom_domain` is executable by `anon` and reveals
// only what visiting the domain would. Subject to RLS like any visitor.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fallback.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "fallback_key";

export const supabaseAnon = createClient(supabaseUrl, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

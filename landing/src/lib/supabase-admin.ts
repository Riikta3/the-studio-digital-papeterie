import { createClient } from "@supabase/supabase-js";

// Server Actions / API Routes only — uses SERVICE_ROLE_KEY, bypasses RLS.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fallback.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_key";

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

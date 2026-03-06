import { createClient } from "@supabase/supabase-js";

// Note: This client should ONLY be used in Server Actions or API Routes.
// It uses the SERVICE_ROLE_KEY to bypass RLS and manage users.

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fallback.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_key";

// We remove the hard throw so `next build` doesn't crash when statically evaluating files
// If this throws, Vercel deployments will fail unless ALL environment variables are perfectly injected into the build step.
// The actual API routes using this will fail at runtime if the keys are truly invalid.

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

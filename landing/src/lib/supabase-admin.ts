import { createClient } from "@supabase/supabase-js";

// Note: This client should ONLY be used in Server Actions or API Routes.
// It uses the SERVICE_ROLE_KEY to bypass RLS and manage users.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase credentials for Admin Client.");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

import { findUserByEmail as findWith } from "@shared/lib/find-user-by-email";

import { supabaseAdmin } from "@/lib/supabase-admin";

/** `@shared/lib/find-user-by-email`, bound to the landing's admin client. */
export function findUserByEmail(email: string) {
  return findWith(supabaseAdmin, email);
}

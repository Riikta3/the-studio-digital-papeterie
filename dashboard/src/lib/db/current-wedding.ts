import { createClient } from "@/utils/supabase/server";

/**
 * Resolves the signed-in couple's wedding, the way every existing action in
 * this project does (see `rsvp-response-actions.ts`).
 *
 * The `wedding_id` this returns is still passed explicitly to every query's
 * `.eq("wedding_id", …)`. RLS already filters by owner, but a policy changed
 * by mistake must not be enough to expose another couple's data.
 */
export async function requireWedding() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) throw new Error("Wedding not found");

  return { supabase, user, weddingId: wedding.id as string };
}

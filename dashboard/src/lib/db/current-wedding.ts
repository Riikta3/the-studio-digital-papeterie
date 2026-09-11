import { createClient } from "@/utils/supabase/server";

/**
 * Resolves the signed-in couple's wedding, the way every existing action in
 * this project does (see `rsvp-response-actions.ts`).
 *
 * The `wedding_id` this returns is still passed explicitly to every query's
 * `.eq("wedding_id", …)`. RLS already filters by owner, but a policy changed
 * by mistake must not be enough to expose another couple's data.
 *
 * ── One wedding per account (v1) ──────────────────────────────────────────
 * `.single()` throws on more than one row, so this is load-bearing: checkout
 * refuses and refunds a second purchase (`create-wedding.ts`), and the whole
 * dashboard reads the couple's wedding this way — around 25 call sites across
 * 18 files at the time of writing, most of them repeating this query inline
 * rather than calling here.
 *
 * Allowing several weddings per account (wedding planners, a gifted
 * invitation) means picking one as "current" instead of assuming it: a
 * selector in the UI, the choice carried in the session or the URL, and this
 * helper resolving it. Route the inline copies through here first — they are
 * the ones that would silently break, since `.single()` starts throwing the
 * moment a second row exists. See the vault note
 * "Provisioning et Facturation".
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

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

  const { data: wedding, error } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  /*
   * `.single()` fails two different ways and used to report both as "Wedding
   * not found", which sent us looking for a missing row when the account in
   * fact owned two — a checkout provisioned twice by a race between the
   * browser and the Stripe webhook. Every dashboard page 500'd, and the error
   * pointed the wrong way for the whole investigation.
   *
   * PGRST116 covers "no rows" and "more than one row" alike, so the count is
   * what tells them apart. A duplicate is now unreachable — `weddings` has a
   * unique index on `user_id` — but rows predating it still exist, and a v2
   * that allows several weddings per account will land here first.
   */
  if (!wedding) {
    const { count } = await supabase
      .from("weddings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) > 1) {
      throw new Error(
        `Account ${user.id} owns ${count} weddings; this dashboard resolves ` +
          `exactly one. Likely a double-provisioned checkout — see the vault ` +
          `note "Provisioning et Facturation".`,
      );
    }

    throw new Error(error ? `Wedding not found: ${error.message}` : "Wedding not found");
  }

  return { supabase, user, weddingId: wedding.id as string };
}

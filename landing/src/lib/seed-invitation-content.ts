import { defaultInvitationData } from "@/components/invitation/themes/defaults";
import type { ModuleId } from "@/components/invitation/themes/types";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Gives a freshly bought wedding the content it starts life with.
 *
 * Before this ran, `createWedding` created the *purchase* — wedding, site,
 * modules, receipts — and no content at all. Two consequences, both bad:
 *
 *   1. The invitation 404'd. `getInvitationPage` returns null for a wedding
 *      with no event, and none was created — so a couple who had just paid
 *      could not open the thing they bought. (The other half of that 404 was
 *      the publication gate, since separated onto `sites.status` by migration
 *      20260912110000 and set at checkout.)
 *
 *   2. The dashboard was blank. Every screen showed an empty list, which tells
 *      a couple nothing about what the product does or what they should write.
 *
 * Both are fixed by writing real rows. Rows, specifically — not render-time
 * fallbacks: the couple has to be able to edit this from the dashboard, and
 * only a row is editable. Everything written here is theirs to rewrite or
 * delete.
 *
 * ## Best-effort by design
 *
 * The order is already paid by the time this runs. A failure here must never
 * fail the provisioning: a couple with a site and no starting programme has a
 * recoverable problem, while a couple charged for a wedding that did not get
 * created has an unrecoverable one. Every step logs and continues, and the
 * caller's result does not depend on it.
 */

type SeedArgs = {
  weddingId: string;
  partner1: string;
  partner2: string;
  /** ISO date (YYYY-MM-DD). */
  weddingDate: string;
  /** Free text, exactly as typed at checkout. */
  venue?: string;
  modules: ModuleId[];
};

/**
 * The main event every wedding gets.
 *
 * `events.key` is a closed set (migration 20260902110000) and `wedding-day` is
 * the one the invitation anchors on: `getInvitationPage` picks it for the
 * countdown, and refuses to render a wedding with no enabled event at all.
 */
const MAIN_EVENT_KEY = "wedding-day";

export async function seedInvitationContent({
  weddingId,
  partner1,
  partner2,
  weddingDate,
  venue,
  modules,
}: SeedArgs): Promise<void> {
  // The same defaults the themes document, derived from what the couple typed
  // rather than invented here — so the seed and the contract cannot drift.
  const data = defaultInvitationData({
    partner1,
    partner2,
    weddingDate,
    venue,
    modules,
  });

  /* -- The main event ------------------------------------------------------ *
   *
   * Written first and on its own: the schedule rows below reference its id,
   * and an invitation with no event does not render at all. `enabled` is true
   * because the couple has paid — the invitation is theirs to share from the
   * moment they own it, not once they find a publish switch.
   */
  const { data: eventRow, error: eventError } = await supabaseAdmin
    .from("events")
    .insert({
      wedding_id: weddingId,
      key: MAIN_EVENT_KEY,
      name: "Notre mariage",
      date: weddingDate,
      // Kept as the couple's own wording would be — free text by design, and
      // the invitation parses it back into an instant for the countdown.
      time: data.schedule?.[0]?.time,
      address: data.venue.name || null,
      dress_code: data.dressCode?.body ?? null,
      position: 1,
      enabled: true,
    })
    .select("id")
    .single();

  if (eventError || !eventRow) {
    // Without the event there is nothing to hang a schedule on, and the
    // invitation cannot render. Logged loudly; the wedding itself still stands.
    console.error("Seed: main event failed", eventError);
    return;
  }

  const eventId = eventRow.id as string;

  /* -- Everything else, in parallel --------------------------------------- *
   *
   * Independent inserts against different tables. Each is allowed to fail on
   * its own without taking the others down, which is why this is
   * `allSettled` over a transaction: a missing FAQ must not cost the couple
   * their programme.
   */
  const results = await Promise.allSettled([
    // Schedule — the starting run of the day, timed off their own ceremony.
    supabaseAdmin.from("schedule_entries").insert(
      (data.schedule ?? []).map((entry, index) => ({
        wedding_id: weddingId,
        event_id: eventId,
        time: entry.time,
        title: entry.title,
        description: entry.description ?? null,
        position: index + 1,
      })),
    ),

    // Venue — the name they typed at checkout, which used to be dropped here
    // and asked for again in the dashboard. One row, `unique(wedding_id)`.
    data.venue.name
      ? supabaseAdmin
          .from("venues")
          .insert({ wedding_id: weddingId, name: data.venue.name })
      : Promise.resolve(null),

    // FAQ — published, so guests see them immediately. The couple edits or
    // unpublishes them like any other entry.
    supabaseAdmin.from("faq_entries").insert(
      (data.faq ?? []).map((entry, index) => ({
        wedding_id: weddingId,
        question: entry.question,
        answer: entry.answer,
        position: index + 1,
        published: true,
      })),
    ),

  ]);

  results.forEach((result, index) => {
    const step = ["schedule", "venue", "faq"][index];
    if (result.status === "rejected") {
      console.error(`Seed: ${step} threw`, result.reason);
    } else if (result.value && "error" in result.value && result.value.error) {
      console.error(`Seed: ${step} failed`, result.value.error);
    }
  });
}

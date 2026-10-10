"use server";

import { revalidatePath } from "next/cache";

import { householdStatusFromGuests, isSamePerson } from "@shared/lib/household-rsvp";
import { createClient } from "@/utils/supabase/server";

/**
 * Attaching an RSVP answer to a household of the guest list, by hand.
 *
 * The invitation attaches an answer itself when the guest's name is in the
 * list (`find_invitation_household`). The others — a typo, a nickname, a
 * forwarded invitation — arrive with `household_id` null, and the couple
 * attaches them here. The members named in the answer get its status, the
 * others are left as they are, and the household status is derived again.
 *
 * Everything goes through the couple's own session: the owner-only policies on
 * `rsvp_responses`, `households` and `guests` decide what may be read and
 * written, no elevated client is involved.
 */

const LOCALES = ["fr", "en", "de", "es", "pt", "it", "ar", "zh", "ja"];

export type LinkResult =
  | { ok: true; updated: number; unmatched: string[] }
  | { ok: false; error: "already_linked" | "not_found" | "failed" };

type Participant = { first_name?: string; last_name?: string };

function revalidate() {
  for (const locale of LOCALES) {
    revalidatePath(`/${locale}/rsvp-responses`);
    revalidatePath(`/${locale}/guests`);
  }
}

async function ownWeddingId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, weddingId: null };

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return { supabase, weddingId: (wedding?.id as string | undefined) ?? null };
}

export async function linkRsvpResponseToHousehold({
  responseId,
  householdId,
}: {
  responseId: string;
  householdId: string;
}): Promise<LinkResult> {
  const { supabase, weddingId } = await ownWeddingId();
  if (!weddingId) return { ok: false, error: "not_found" };

  const [{ data: response }, { data: household }] = await Promise.all([
    supabase
      .from("rsvp_responses")
      .select("id, name, attendance, respondent_first_name, respondent_last_name, participants, household_id")
      .eq("id", responseId)
      .eq("wedding_id", weddingId)
      .maybeSingle(),
    supabase
      .from("households")
      .select("id, status, guests(id, first_name, last_name, status)")
      .eq("id", householdId)
      .eq("wedding_id", weddingId)
      .maybeSingle(),
  ]);

  if (!response || !household) return { ok: false, error: "not_found" };

  // One live answer per household (a unique index): the household answered
  // already, from the invitation or by an earlier attachment.
  const { count } = await supabase
    .from("rsvp_responses")
    .select("id", { count: "exact", head: true })
    .eq("household_id", householdId);
  if ((count ?? 0) > 0) return { ok: false, error: "already_linked" };

  const respondent =
    [response.respondent_first_name, response.respondent_last_name].filter(Boolean).join(" ") ||
    response.name;
  const companions = ((response.participants as Participant[] | null) ?? [])
    .map((p) => [p.first_name, p.last_name].filter(Boolean).join(" "))
    .filter(Boolean);

  // The respondent takes the answer's attendance; companions are only ever
  // listed on a "yes", so they come. An undecided answer changes nobody.
  const named: { name: string; status: "confirmed" | "declined" | null }[] = [
    {
      name: respondent,
      status: response.attendance === true ? "confirmed" : response.attendance === false ? "declined" : null,
    },
    ...companions.map((name) => ({
      name,
      status: response.attendance === true ? ("confirmed" as const) : null,
    })),
  ];

  // Attach first: if another answer took the household in the meantime, the
  // unique index refuses this one before any guest has been changed.
  const { error: linkError } = await supabase
    .from("rsvp_responses")
    .update({ household_id: householdId })
    .eq("id", responseId)
    .eq("wedding_id", weddingId);

  if (linkError) {
    return { ok: false, error: linkError.code === "23505" ? "already_linked" : "failed" };
  }

  const guests = (household.guests ?? []) as {
    id: string;
    first_name: string;
    last_name: string;
    status: string;
  }[];
  const statuses = new Map(guests.map((guest) => [guest.id, guest.status]));
  const unmatched: string[] = [];
  let updated = 0;

  for (const person of named) {
    const guest = guests.find((g) => isSamePerson(person.name, g));
    if (!guest) {
      unmatched.push(person.name);
      continue;
    }
    if (!person.status || guest.status === person.status) continue;

    const { error } = await supabase
      .from("guests")
      .update({ status: person.status })
      .eq("id", guest.id)
      .eq("wedding_id", weddingId);
    if (error) {
      console.error("[rsvp-link] guest update failed", error.message);
      revalidate();
      return { ok: false, error: "failed" };
    }
    statuses.set(guest.id, person.status);
    updated += 1;
  }

  const status = householdStatusFromGuests([...statuses.values()]);
  if (status && status !== household.status) {
    await supabase.from("households").update({ status }).eq("id", householdId).eq("wedding_id", weddingId);
  }

  revalidate();
  return { ok: true, updated, unmatched };
}

/**
 * Detaches an answer, for an attachment made by mistake. The guests' statuses
 * are left as they are: the couple corrects them on the guest list if needed.
 */
export async function unlinkRsvpResponse(responseId: string): Promise<{ ok: boolean }> {
  const { supabase, weddingId } = await ownWeddingId();
  if (!weddingId) return { ok: false };

  const { error } = await supabase
    .from("rsvp_responses")
    .update({ household_id: null })
    .eq("id", responseId)
    .eq("wedding_id", weddingId);

  if (error) return { ok: false };
  revalidate();
  return { ok: true };
}

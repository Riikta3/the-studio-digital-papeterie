"use server";

import { callerBucket, hasGuestPass } from "@/lib/guest-gate";
import { createClient } from "@/utils/supabase/server";

import type { SubmissionResult } from "./invitation-submissions";

/**
 * The invitation's RSVP for a household of the couple's guest list.
 *
 * The link is the same for every guest, so the RSVP form identifies them by
 * the name they type: `findInvitationHousehold` looks it up in the couple's
 * list and, when it belongs to exactly one household, the form asks an answer
 * for each of its members. `submitHouseholdRsvp` writes those answers onto the
 * guest list itself. A name that matches nothing keeps the free-form answer of
 * `submitRsvp`, which the couple attaches by hand in the dashboard.
 *
 * Everything that matters — whole-name matching, the column whitelist, "every
 * member answered", the rate limit — lives in the RPCs of
 * `20261010120000_invitation_household_rsvp.sql`, because the anon key is
 * public and anyone can call them without going through this file. What is
 * added here is the guest code: on a gated invitation, only a visitor holding
 * a pass may look a name up.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const GENERIC_ERROR = "Erreur lors de l'enregistrement. Merci de réessayer.";

export type HouseholdMemberStatus = "confirmed" | "declined" | "pending";

export type HouseholdMember = {
  id: string;
  firstName: string;
  lastName: string;
  isChild: boolean;
  status: HouseholdMemberStatus;
};

export type InvitationHousehold = {
  id: string;
  name: string;
  /** When this household last answered, ISO. Null if never. */
  answeredAt: string | null;
  members: HouseholdMember[];
};

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/** On a gated invitation, whether this visitor already typed the code. */
async function mayUse(weddingId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: gated, error } = await supabase.rpc("invitation_is_gated", {
    p_wedding_id: weddingId,
  });

  // Unknown is closed: a lookup into the guest list is not worth a guess.
  if (error) return false;
  if (gated !== true) return true;

  const { data: fingerprint } = await supabase.rpc("guest_code_fingerprint", {
    p_wedding_id: weddingId,
  });

  return typeof fingerprint === "string" && (await hasGuestPass(weddingId, fingerprint));
}

function toStatus(value: unknown): HouseholdMemberStatus {
  return value === "confirmed" || value === "declined" ? value : "pending";
}

/**
 * The household holding this full name, or null.
 *
 * Null covers "nobody", "two households" and "too many tries" alike: the form
 * falls back to the free answer in every case, and a guesser learns nothing
 * from the difference.
 */
export async function findInvitationHousehold(
  weddingId: string,
  fullName: string,
): Promise<InvitationHousehold | null> {
  const name = clean(fullName, 160);
  if (!UUID_RE.test(weddingId ?? "") || !name.includes(" ")) return null;
  if (!(await mayUse(weddingId))) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_invitation_household", {
    p_wedding_id: weddingId,
    p_full_name: name,
    p_bucket: await callerBucket(weddingId),
  });

  if (error) {
    console.error("[household-rsvp] lookup failed", error.code, error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.household_id) return null;

  const members = (Array.isArray(row.members) ? row.members : []).map(
    (member: Record<string, unknown>): HouseholdMember => ({
      id: String(member.id),
      firstName: String(member.first_name ?? ""),
      lastName: String(member.last_name ?? ""),
      isChild: member.is_child === true,
      status: toStatus(member.status),
    }),
  );

  if (members.length === 0) return null;

  return {
    id: row.household_id,
    name: row.household_name ?? "",
    answeredAt: row.answered_at ?? null,
    members,
  };
}

export type HouseholdRsvpSubmission = {
  weddingId: string;
  householdId: string;
  /** The name typed in the form; it must still belong to the household. */
  fullName: string;
  answers: { guestId: string; status: HouseholdMemberStatus }[];
  dietary?: string;
  message?: string;
};

export async function submitHouseholdRsvp(
  input: HouseholdRsvpSubmission,
): Promise<SubmissionResult> {
  if (!UUID_RE.test(input?.weddingId ?? "") || !UUID_RE.test(input?.householdId ?? "")) {
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!(await mayUse(input.weddingId))) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const answers = (Array.isArray(input.answers) ? input.answers : [])
    .slice(0, 40)
    .filter((answer) => UUID_RE.test(answer?.guestId ?? ""))
    .map((answer) => ({ id: answer.guestId, status: toStatus(answer.status) }));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_invitation_household_rsvp", {
    p_wedding_id: input.weddingId,
    p_household_id: input.householdId,
    p_full_name: clean(input.fullName, 160),
    p_answers: answers,
    p_dietary: clean(input.dietary, 200),
    p_message: clean(input.message, 1000),
    p_bucket: await callerBucket(input.weddingId),
  });

  if (error || data !== true) {
    if (error) console.error("[household-rsvp] submit failed", error.code, error.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  return { ok: true };
}

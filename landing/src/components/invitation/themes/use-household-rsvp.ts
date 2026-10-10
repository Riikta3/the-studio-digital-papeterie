"use client";

import { type FocusEvent, useRef, useState } from "react";

import {
  type HouseholdMemberStatus,
  type InvitationHousehold,
  findInvitationHousehold,
  submitHouseholdRsvp,
} from "@/actions/invitation-household";
import type { SubmissionResult } from "@/actions/invitation-submissions";

/**
 * The guest-list half of a theme's RSVP form.
 *
 * Once the guest has typed their name (on blur, or at the latest on submit),
 * it is looked up in the couple's list. When it belongs to a household, the
 * theme swaps its own "are you coming / partner / children" questions for
 * `<HouseholdMembers>`, which asks an answer for every member, and the answer
 * goes onto the guest list through `submitHouseholdRsvp`. When it does not,
 * nothing changes and the theme's free form is sent as before.
 *
 * A theme wires it in three places:
 *   - `onBlur={household.onNameBlur}` on the `fullName` input;
 *   - `{household.current ? <HouseholdMembers … /> : <its own questions>}`;
 *   - first thing in its submit handler, after the demo guard:
 *       `const outcome = await household.submit(form);`
 *     "fallback" → carry on with `submitRsvp`; "shown" → stop, the members
 *     were just revealed and need answers; otherwise it is the result.
 *
 * Without a wedding id (the showcase, the editor's preview) nothing is ever
 * looked up, so the demo form stays exactly what it was.
 */

export type HouseholdSubmitOutcome = "fallback" | "shown" | SubmissionResult;

/** The radio group name of one member — the contract with `HouseholdMembers`. */
export function memberFieldName(guestId: string): string {
  return `member-${guestId}`;
}

function nameKey(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export function useHouseholdRsvp(weddingId: string | undefined) {
  const [current, setCurrent] = useState<InvitationHousehold | null>(null);
  const [missing, setMissing] = useState(false);
  // The last name looked up and its pending answer, so a blur followed by a
  // quick submit makes one call, not two.
  const last = useRef<{ key: string; result: Promise<InvitationHousehold | null> } | null>(null);

  function lookup(fullName: string): Promise<InvitationHousehold | null> {
    const key = nameKey(fullName);
    if (!weddingId || !key.includes(" ")) {
      setCurrent(null);
      return Promise.resolve(null);
    }
    if (last.current?.key === key) return last.current.result;

    const result = findInvitationHousehold(weddingId, fullName)
      .catch(() => null)
      .then((household) => {
        // A later lookup has replaced this one: its answer wins.
        if (last.current?.key === key) setCurrent(household);
        return household;
      });
    last.current = { key, result };
    return result;
  }

  function onNameBlur(event: FocusEvent<HTMLInputElement>) {
    void lookup(event.currentTarget.value);
  }

  async function submit(
    form: Pick<FormData, "get">,
    /** For a theme that folds extra answers into the message. */
    overrides?: { message?: string },
  ): Promise<HouseholdSubmitOutcome> {
    if (!weddingId) return "fallback";

    const fullName = String(form.get("fullName") ?? "");
    const shown = current;
    const household = await lookup(fullName);
    if (!household) return "fallback";

    // Found only now (the guest pressed Enter in the name field): show the
    // members and let them answer before anything is sent.
    if (!shown || shown.id !== household.id) return "shown";

    const answers = household.members.map((member) => {
      const value = form.get(memberFieldName(member.id));
      return {
        guestId: member.id,
        status: (value === "confirmed" || value === "declined" || value === "pending"
          ? value
          : null) as HouseholdMemberStatus | null,
      };
    });

    if (answers.some((answer) => answer.status === null)) {
      setMissing(true);
      return "shown";
    }
    setMissing(false);

    return submitHouseholdRsvp({
      weddingId,
      householdId: household.id,
      fullName,
      answers: answers as { guestId: string; status: HouseholdMemberStatus }[],
      dietary: String(form.get("dietary") ?? ""),
      message: overrides?.message ?? String(form.get("message") ?? ""),
    });
  }

  return {
    /** The household of the name typed, once found. */
    current,
    /** True after a submit that left a member without an answer. */
    missing,
    onNameBlur,
    submit,
  };
}

export type HouseholdRsvp = ReturnType<typeof useHouseholdRsvp>;

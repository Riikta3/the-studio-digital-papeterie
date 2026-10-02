"use client";

import { type FormEvent, useState } from "react";

import { submitRsvp } from "@/actions/invitation-submissions";

import { MAX_CHILDREN, buildRsvpSubmission } from "./guest-rsvp-payload";
import type { InvitationData } from "./types";

/**
 * State and submission of a theme's RSVP form.
 *
 * Two modes, decided by `data.weddingId` (see `types.ts`): with an id the
 * answer is persisted through `submitRsvp`; without one — the showcase, the
 * editor's preview — the form confirms locally and writes nothing. The server
 * action also rejects a missing id, so the demo path is closed on both sides.
 *
 * The theme draws the form. It must:
 *   - give the radios `name="attendance"` and call `setAttending(true | false)`
 *     from their `onChange`;
 *   - use the field names listed in `guest-rsvp-payload.ts`;
 *   - show party questions only when `showParty` is true, the partner choice
 *     only when `allowPartner`, the children only when `allowChildren`;
 *   - show `error` (role="alert") and disable the button while `pending`.
 */
export function useGuestRsvp(data: InvitationData) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partyMode, setPartyMode] = useState<"solo" | "partner">("solo");
  const [childCount, setChildCount] = useState(0);
  /** Null until the guest answers; nobody declares a party before saying yes. */
  const [attending, setAttending] = useState<boolean | null>(null);

  const weddingId = data.weddingId;
  // `settings.adults_only` arrives inverted as `allowChildren`; absent means
  // "not answered", and children are allowed unless explicitly ruled out.
  const allowChildren = data.rsvp?.allowChildren !== false;
  const allowPartner = data.rsvp?.allowPartner === true;
  const showParty = attending === true;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    // Demo: no wedding to attach the answer to. Confirm locally, persist
    // nothing — this is the guard the showcase relies on.
    if (!weddingId) {
      setSent(true);
      return;
    }

    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const result = await submitRsvp(
      buildRsvpSubmission({
        weddingId,
        form,
        attending: attending ?? form.get("attendance") === "yes",
        partyMode,
        childCount,
        allowChildren,
      }),
    );

    setPending(false);
    if (result.ok) setSent(true);
    else setError(result.error);
  }

  return {
    sent,
    pending,
    error,
    partyMode,
    setPartyMode,
    childCount,
    setChildCount,
    attending,
    setAttending,
    allowChildren,
    allowPartner,
    showParty,
    maxChildren: MAX_CHILDREN,
    handleSubmit,
  };
}

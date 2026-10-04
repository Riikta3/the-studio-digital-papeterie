"use client";

import { type FormEvent, useState } from "react";

import { submitGuestbookMessage } from "@/actions/invitation-submissions";

import type { InvitationData } from "./types";

/** Longest message a guest can send; the action and the table agree. */
export const GUESTBOOK_MAX_MESSAGE = 1000;
export const GUESTBOOK_MAX_NAME = 80;

/**
 * State and submission of a theme's guestbook form.
 *
 * The guestbook is private (decision of 2026-10-03): a guest writes to the
 * couple, who read the messages in the dashboard. A theme draws the form and
 * a thank-you, never a wall of other guests' words.
 *
 * Two modes, decided by `data.weddingId`: with an id the message is persisted
 * through `submitGuestbookMessage`; without one — the showcase, the editor's
 * preview — the form confirms locally and writes nothing.
 *
 * The theme draws the form. It must:
 *   - name the fields `guestName` (input, `maxLength={GUESTBOOK_MAX_NAME}`)
 *     and `message` (textarea, `maxLength={GUESTBOOK_MAX_MESSAGE}`), both
 *     `required`;
 *   - call `handleSubmit` from the form's `onSubmit`;
 *   - show `error` (role="alert") and disable the button while `pending`;
 *   - replace the form with its thank-you when `sent`, and offer `reset()`
 *     to write another message.
 */
export function useGuestGuestbook(data: InvitationData) {
  const weddingId = data.weddingId;
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The name the guest signed with, for a thank-you that says it back. */
  const [signedAs, setSignedAs] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    const guestName = String(form.get("guestName") ?? "").trim();
    const message = String(form.get("message") ?? "");

    // Demo: no wedding to attach the message to. Confirm locally, persist nothing.
    if (!weddingId) {
      setSignedAs(guestName);
      setSent(true);
      return;
    }

    setPending(true);
    setError(null);
    const result = await submitGuestbookMessage({ weddingId, guestName, message });
    setPending(false);

    if (result.ok) {
      setSignedAs(guestName);
      setSent(true);
    } else {
      setError(result.error);
    }
  }

  function reset() {
    setSent(false);
    setError(null);
  }

  return { sent, pending, error, signedAs, handleSubmit, reset };
}

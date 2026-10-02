import type { AmountDue } from "@shared/lib/addable-modules";

import type { ModuleLists } from "./types";

/**
 * What the payment dialog and the return from PayPal/Klarna tell the couple.
 * Pure, so the rule that matters most — never « failed » once the money is
 * taken — is tested rather than remembered.
 */

type Completion =
  | { ok: true; status: "granted" | "already-owned"; modules: ModuleLists }
  | { ok: true; status: "processing" }
  | { ok: false; error: string };

export type PaymentOutcome =
  | { kind: "live" | "already-owned"; modules: ModuleLists }
  | { kind: "confirming" }
  | { kind: "failed" };

/** Stripe's word that the money is taken or on its way: the confirmed intent, or the return URL's `redirect_status`. */
export function isCharged(status: string | null | undefined): boolean {
  return status === "succeeded" || status === "processing";
}

/**
 * Once Stripe has charged, a fast path that fails is only a delay — the
 * webhook grants the modules — so it must not read as a failed payment and
 * invite a second one.
 */
export function paymentOutcome(result: Completion, { charged }: { charged: boolean }): PaymentOutcome {
  if (!result.ok) return charged ? { kind: "confirming" } : { kind: "failed" };
  if (result.status === "processing") return { kind: "confirming" };
  return { kind: result.status === "granted" ? "live" : "already-owned", modules: result.modules };
}

/**
 * The chip, the phone strip and the banner offer to pay only with nothing
 * unsaved: PayPal and Klarna leave the page, and the edits would go with it
 * (spec D4). « Enregistrer » comes first.
 */
export function canOfferPayment(due: AmountDue | null, isDirty: boolean): due is AmountDue {
  return due !== null && !isDirty;
}

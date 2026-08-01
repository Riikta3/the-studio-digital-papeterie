import { computeOrderTotal, type OrderItems } from "@/lib/pricing";
import { stripe, toCents } from "@/lib/stripe";

export type PaymentCheck =
  | { ok: true; amountPaid: number; alreadyProvisionedAs?: string }
  | { ok: false; reason: string };

/**
 * Confirms that a PaymentIntent really was paid, for this exact order.
 *
 * Provisioning is triggered from the browser, so nothing here may trust the
 * client: the intent is re-fetched from Stripe and its amount is compared
 * against a server-side recomputation of the order. Without this, adding
 * `?payment_success=true` to the checkout URL would hand out a free site.
 */
export async function verifyPaymentForOrder(
  paymentIntentId: string,
  items: OrderItems,
): Promise<PaymentCheck> {
  if (!paymentIntentId) {
    return { ok: false, reason: "Référence de paiement manquante." };
  }

  const expectedTotal = computeOrderTotal(items);
  if (expectedTotal === null) {
    return { ok: false, reason: "Offre invalide." };
  }

  let intent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch {
    return { ok: false, reason: "Paiement introuvable." };
  }

  if (intent.status !== "succeeded") {
    return {
      ok: false,
      reason: `Paiement non abouti (statut : ${intent.status}).`,
    };
  }

  // Guards against paying for a cheap order and then upgrading the cart
  // before provisioning: the charged amount must match what is being ordered.
  const expectedCents = toCents(expectedTotal);
  if (intent.amount_received !== expectedCents) {
    return {
      ok: false,
      reason: `Le montant réglé (${(intent.amount_received / 100).toFixed(2)}€) ne correspond pas à la commande (${expectedTotal}€).`,
    };
  }

  return {
    ok: true,
    amountPaid: intent.amount_received,
    // Set by markPaymentProvisioned() once a wedding exists for this payment.
    alreadyProvisionedAs: intent.metadata?.wedding_id || undefined,
  };
}

/** Records which wedding a payment produced, making provisioning idempotent. */
export async function markPaymentProvisioned(
  paymentIntentId: string,
  weddingId: string,
): Promise<void> {
  try {
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { wedding_id: weddingId },
    });
  } catch (err) {
    // Non-fatal: the wedding exists, only the replay guard is missing.
    console.error("[STRIPE_MARK_PROVISIONED]", err);
  }
}

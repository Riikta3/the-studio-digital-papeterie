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
  /**
   * The email provisioning is about to create the account under. It must match
   * the one recorded on the intent when it was created.
   *
   * Without this the amount was checked but the buyer was not: a payment
   * reference is not a secret (it reaches the browser that paid, and any
   * proxy or log along the way), and provisioning is an unauthenticated
   * endpoint. Whoever replayed a not-yet-provisioned id with their own address
   * received the wedding someone else had just paid for, magic link included.
   *
   * Optional so the webhook path, which reads the address off the intent
   * itself and therefore cannot disagree with it, can keep calling without it.
   */
  expectedEmail?: string,
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

  // The buyer must be the one the intent was created for. Compared case- and
  // whitespace-insensitively, since the address makes a round trip through the
  // browser between checkout and provisioning.
  if (expectedEmail) {
    const paidBy = (
      intent.metadata?.email ||
      intent.receipt_email ||
      ""
    )
      .trim()
      .toLowerCase();

    if (!paidBy || paidBy !== expectedEmail.trim().toLowerCase()) {
      // Deliberately vague: this is reachable without authentication, and
      // naming the address on the intent would leak who paid.
      return { ok: false, reason: "Paiement introuvable." };
    }
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

/**
 * Refunds a payment that cannot be fulfilled.
 *
 * Used when a customer is charged for something they already own — navigating
 * back from the dashboard into a still-populated checkout and paying again.
 * Nothing is provisioned for that second charge, so holding onto the money is
 * not an option: the refund is issued immediately rather than left as a
 * support ticket the customer has to open themselves.
 *
 * Idempotent through `metadata.refunded_reason`: a retried provisioning must
 * not stack refunds on the same intent.
 */
export async function refundPayment(
  paymentIntentId: string,
  reason: string,
): Promise<{ refunded: boolean; detail?: string }> {
  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.metadata?.refunded_reason) {
      return { refunded: true, detail: "already refunded" };
    }

    if (intent.status !== "succeeded") {
      return { refunded: false, detail: `status ${intent.status}` };
    }

    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: "duplicate",
    });

    // Marked after the refund succeeds, so a failure here is retried rather
    // than recorded as done.
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: { ...intent.metadata, refunded_reason: reason },
    });

    console.log(`💸 Refunded ${paymentIntentId}: ${reason}`);
    return { refunded: true };
  } catch (err) {
    // Surfaced loudly: the customer has been charged for nothing, and this is
    // now a manual refund in the Stripe dashboard.
    console.error(`[REFUND_FAILED] ${paymentIntentId}`, err);
    return { refunded: false, detail: (err as Error).message };
  }
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

import { NextResponse } from "next/server";

import { buildOrderMetadata } from "@/lib/order-metadata";
import { computeOrderTotal } from "@/lib/pricing";
import { stripe, toCents } from "@/lib/stripe";

/** Statuses where an intent can still be repriced instead of recreated. */
const REUSABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

export async function POST(req: Request) {
  try {
    const { items, email, paymentIntentId, weddingInfo } = await req.json();

    if (!items?.plan) {
      return NextResponse.json(
        { error: "Invalid payload or missing plan" },
        { status: 400 },
      );
    }

    // Never trust a client-sent amount: recompute from the shared pricing rules.
    const amount = computeOrderTotal(items);
    if (amount === null) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ clientSecret: null, amount: 0 });
    }

    const amountInCents = toCents(amount);

    // Order summary kept on the intent so a failed provisioning can always be
    // reconstructed from Stripe alone. This now carries the couple's identity
    // too, not just the basket: the webhook fallback provisions from this and
    // nothing else once the customer's browser is gone.
    const orderMetadata = buildOrderMetadata({
      plan: String(items.plan),
      modules: items.modules ?? [],
      languages: items.languages ?? [],
      extras: items.extras ?? [],
      email: email ? String(email) : undefined,
      themeId: items.themeId,
      animationId: items.animationId,
      adultsOnly: Boolean(items.adultsOnly),
      firstName: weddingInfo?.firstName,
      lastName: weddingInfo?.lastName,
      partnerName: weddingInfo?.partnerName,
      weddingDate: weddingInfo?.weddingDate,
      venue: weddingInfo?.venue,
      locale: weddingInfo?.locale,
    });

    // Reprice the existing intent when the cart changed, so the customer can
    // never pay an amount captured before they edited their order.
    if (paymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

        /*
         * A settled intent is spent, whoever paid it. This endpoint is only
         * ever asked for a payment form, so the answer is a usable one — an
         * intent that has already been charged cannot be charged again, and
         * refusing here refuses the WRONG order: the new one.
         *
         * `intentIdRef` outlives the order it belonged to. It is a ref on the
         * checkout component, never cleared once an order completes, so a
         * couple who buys and comes back — a second invitation, a new test —
         * re-enters the funnel with the previous order's id still in hand.
         * Stripe found it `succeeded` and this branch answered 409 "Cette
         * commande a déjà été réglée" over a basket nobody had paid for, then
         * the guard in the steps layout walked them back to /studio/start.
         *
         * A first fix compared the buyer's address and refused when it
         * matched, on the theory that the same buyer meant a genuine replay.
         * That was the common case, not the rare one: the couple buying again
         * is usually the same person. Same symptom, narrower.
         *
         * Falling through mints a fresh intent, which is what every other
         * unusable status already does below. Nothing is lost by it: the
         * settled intent keeps its own metadata and its own `wedding_id`, so
         * the order it paid for stays reconstructible from Stripe alone, and
         * `verifyPaymentForOrder` still refuses to provision twice from it.
         *
         * A real reload of the success page never reaches here — that path
         * carries `payment_success=true`, and the checkout skips intent
         * creation entirely while it is set.
         */
        if (REUSABLE_STATUSES.has(existing.status)) {
          // Always resync the metadata, not just when the amount moved: two
          // different baskets can cost the same (swapping one 45€ extra for
          // another, or one paid language for another). Skipping the update
          // there left Stripe describing the previous order, and Stripe is
          // what a failed provisioning is reconstructed from.
          // Key order differs between our literal and Stripe's response, so
          // compare entries sorted rather than raw JSON.
          const stable = (m: Record<string, string>) =>
            JSON.stringify(Object.entries(m).sort());
          const metadataChanged =
            stable((existing.metadata ?? {}) as Record<string, string>) !==
            stable(orderMetadata);

          const updated =
            existing.amount === amountInCents && !metadataChanged
              ? existing
              : await stripe.paymentIntents.update(paymentIntentId, {
                  amount: amountInCents,
                  metadata: orderMetadata,
                });

          return NextResponse.json({
            clientSecret: updated.client_secret,
            paymentIntentId: updated.id,
            amount,
          });
        }
      } catch {
        // Unknown or deleted intent — fall through and create a fresh one.
      }

      /*
       * Any other status — `succeeded` above all — falls through here on
       * purpose. A settled intent is spent: it cannot be charged again, so
       * the only useful answer to "give me a payment form" is a new intent.
       *
       * This used to answer 409 "Cette commande a déjà été réglée" instead,
       * which refused the WRONG order — the new one. `intentIdRef` is a ref on
       * the checkout component and is never cleared once an order completes,
       * so a couple who buys and comes back re-enters the funnel still
       * carrying the previous order's id. They saw that error over a basket
       * nobody had paid for, and the steps layout then walked them back to
       * /studio/start.
       *
       * Nothing is lost: the settled intent keeps its metadata and its
       * `wedding_id`, so the order it paid for stays reconstructible from
       * Stripe alone, and `verifyPaymentForOrder` still refuses to provision
       * from it twice. A genuine reload of the success page never reaches
       * this route — that path carries `payment_success=true`, and the
       * checkout skips intent creation entirely while it is set.
       */
    }

    // Reuse the Stripe customer for this email so repeat orders stay grouped.
    let customerId: string | undefined;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId =
        existing.data[0]?.id ??
        (
          await stripe.customers.create({
            email,
            metadata: { source: "wedding_checkout" },
          })
        ).id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      ...(customerId ? { customer: customerId } : {}),
      metadata: orderMetadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
    });
  } catch (err: any) {
    console.error("[STRIPE_ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

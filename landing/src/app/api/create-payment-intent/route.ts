import { NextResponse } from "next/server";

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
    const { items, email, paymentIntentId } = await req.json();

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
    // reconstructed from Stripe alone.
    const orderMetadata = {
      plan: String(items.plan),
      modules: (items.modules ?? []).join(","),
      languages: (items.languages ?? []).join(","),
      extras: (items.extras ?? []).join(","),
      ...(email ? { email: String(email) } : {}),
    };

    // Reprice the existing intent when the cart changed, so the customer can
    // never pay an amount captured before they edited their order.
    if (paymentIntentId) {
      try {
        const existing = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (existing.status === "succeeded") {
          return NextResponse.json(
            { error: "Cette commande a déjà été réglée." },
            { status: 409 },
          );
        }

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
        // Unknown or unusable intent — fall through and create a fresh one.
      }
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

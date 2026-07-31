import { NextResponse } from "next/server";
import Stripe from "stripe";

import { computeOrderTotal } from "@/lib/pricing";

// Initialize Stripe with a fallback so `next build` doesn't crash when
// STRIPE_SECRET_KEY is absent from the build environment.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_fallback", {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  try {
    const { items, email } = await req.json();

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

    // Reuse the Stripe customer for this email so repeat orders stay grouped.
    let customerId: string | undefined;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId =
        existing.data[0]?.id ??
        (await stripe.customers.create({
          email,
          metadata: { source: "wedding_checkout" },
        })).id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      ...(customerId ? { customer: customerId } : {}),
      metadata: {
        plan: items.plan,
        ...(email ? { email } : {}),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
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

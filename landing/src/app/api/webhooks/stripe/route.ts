import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { findUserByEmail } from "@/lib/find-user-by-email";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

/*
 * Uses the shared lazy client from `@/lib/stripe` rather than constructing its
 * own at module scope.
 *
 * `new Stripe(process.env.STRIPE_SECRET_KEY as string)` ran the moment this
 * module was imported, and `next build` imports every route to collect page
 * data. With no key in the build environment the constructor threw
 * "Neither apiKey nor config.authenticator provided" and the whole build
 * failed on this file — the `as string` cast hid an undefined at compile time
 * and moved the failure to build time.
 *
 * The shared client constructs on first real request instead, and refuses to
 * run with a missing or test key in production. This route was the last one
 * still holding its own instance.
 */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET in environment");
    return NextResponse.json(
      { error: "Configuration Exception" },
      { status: 500 },
    );
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Persist every event before acting on it. The unique constraint on
  // stripe_event_id makes redeliveries no-ops, and the stored payload keeps a
  // paid order recoverable if provisioning never completed.
  const intentForLog = event.data.object as Stripe.PaymentIntent;
  const { error: logError } = await supabaseAdmin.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payment_intent_id: intentForLog?.id ?? null,
    customer_email:
      intentForLog?.metadata?.email ?? intentForLog?.receipt_email ?? null,
    amount_cents: intentForLog?.amount ?? null,
    currency: intentForLog?.currency ?? null,
    status: intentForLog?.status ?? "received",
    raw_payload: event as unknown as Record<string, unknown>,
  });

  if (logError?.code === "23505") {
    // Already processed — Stripe retries deliveries, so acknowledge and stop.
    console.log(`↩️ Duplicate Stripe event ignored: ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const email =
          paymentIntent.metadata.email ||
          (paymentIntent.receipt_email as string);

        if (email) {
          const user = await findUserByEmail(email);

          if (user) {
            await supabaseAdmin.from("billing").insert({
              user_id: user.id,
              amount: paymentIntent.amount, // in cents
              currency: paymentIntent.currency,
              status: "succeeded",
              plan_name: paymentIntent.metadata.plan || "unknown",
              payment_method:
                paymentIntent.payment_method_types?.[0] || "unknown",
            });
            console.log(`🧾 Billing record inserted for ${email}`);
          } else {
            // The customer paid but no account exists yet: either provisioning
            // is still running, or the browser died right after payment.
            // stripe_events keeps the intent metadata (the full basket), so a
            // paid order can always be recovered.
            console.warn(
              `⚠️ Paid but unprovisioned: ${email} (${paymentIntent.id})`,
            );
          }
        }
        break;
      }

      case "charge.dispute.created": {
        // Suspend the site on a chargeback to limit fraud exposure.
        const dispute = event.data.object as Stripe.Dispute;
        const email =
          dispute.charge && typeof dispute.charge === "object"
            ? dispute.charge.billing_details?.email
            : null;

        if (email) {
          const user = await findUserByEmail(email);
          if (user) {
            const { data: weddings } = await supabaseAdmin
              .from("weddings")
              .select("id")
              .eq("user_id", user.id)
              .limit(1);

            if (weddings?.length) {
              await supabaseAdmin
                .from("sites")
                .update({ status: "suspended" })
                .eq("wedding_id", weddings[0].id);
              console.log(`🛑 Site suspended due to chargeback for ${email}`);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 },
    );
  }
}

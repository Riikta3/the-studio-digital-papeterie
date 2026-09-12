import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { provisionFromPaymentIntent } from "@/actions/create-wedding";
import { findUserByEmail } from "@/lib/find-user-by-email";
import { issueInvoiceForPayment } from "@/lib/invoice";
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

  const intentForLog = event.data.object as Stripe.PaymentIntent;

  // Idempotency gate. Only an event whose handler actually completed is marked
  // "processed", so a delivery that failed mid-handler is retried on Stripe's
  // next attempt instead of being waved through as a duplicate.
  const { data: seen } = await supabaseAdmin
    .from("stripe_events")
    .select("id, status")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (seen?.status === "processed") {
    console.log(`↩️ Duplicate Stripe event ignored: ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record the event before acting on it: the stored payload carries the full
  // basket, so a paid order stays recoverable even if the handler below dies.
  const eventRow = {
    stripe_event_id: event.id,
    event_type: event.type,
    payment_intent_id: intentForLog?.id ?? null,
    customer_email:
      intentForLog?.metadata?.email ?? intentForLog?.receipt_email ?? null,
    amount_cents: intentForLog?.amount ?? null,
    currency: intentForLog?.currency ?? null,
    raw_payload: event as unknown as Record<string, unknown>,
  };

  await supabaseAdmin
    .from("stripe_events")
    .upsert(
      { ...eventRow, status: intentForLog?.status ?? "received" },
      { onConflict: "stripe_event_id" },
    );

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const email =
          paymentIntent.metadata.email ||
          (paymentIntent.receipt_email as string);

        if (email) {
          let user = await findUserByEmail(email);

          // Safety net. Provisioning normally runs in the customer's browser
          // right after payment; if their tab died in those two seconds the
          // charge settled and nothing was created. This used to only warn.
          // Stripe retries this delivery, so the order still gets fulfilled.
          if (!user) {
            console.warn(
              `⚠️ Paid but unprovisioned, recovering: ${email} (${paymentIntent.id})`,
            );

            const recovery = await provisionFromPaymentIntent(paymentIntent);

            if (recovery.provisioned) {
              console.log(
                `🛟 Recovered by webhook: wedding ${recovery.weddingId}`,
              );
              // Re-resolve: the billing row below needs the user just created.
              user = await findUserByEmail(email);
            } else {
              // Throwing returns 500 so Stripe retries rather than dropping a
              // paid order. `stripe_events` keeps the full basket meanwhile.
              console.error(
                `[PROVISION_RECOVERY_FAILED] ${paymentIntent.id}: ${recovery.reason}`,
              );
              throw new Error(
                `Recovery failed for ${paymentIntent.id}: ${recovery.reason}`,
              );
            }
          }

          if (user) {
            // Upsert on stripe_payment_intent_id (unique): the column exists
            // precisely so a Stripe redelivery cannot bill the couple twice.
            // A plain insert left it null, so the constraint never applied and
            // every retry added another row.
            const { error: billingError } = await supabaseAdmin
              .from("billing")
              .upsert(
                {
                  user_id: user.id,
                  stripe_payment_intent_id: paymentIntent.id,
                  amount: paymentIntent.amount, // in cents
                  currency: paymentIntent.currency,
                  status: "succeeded",
                  plan_name: paymentIntent.metadata.plan || "unknown",
                  payment_method:
                    paymentIntent.payment_method_types?.[0] || "unknown",
                },
                { onConflict: "stripe_payment_intent_id" },
              );

            if (billingError) {
              // Surface it: a paid order with no billing row is a support case,
              // and returning 500 makes Stripe retry the delivery.
              console.error("[BILLING_INSERT_FAILED]", paymentIntent.id, billingError);
              throw billingError;
            }

            console.log(`🧾 Billing record recorded for ${email}`);

            // 🧾 Invoice — issued once the payment is recorded, never before:
            // French law requires one per sale, and its number is drawn from a
            // gapless sequence, so it must not be minted for a payment that
            // failed to book.
            await issueInvoiceForPayment({
              userId: user.id,
              email,
              paymentIntent,
            });
          } else {
            // Recovery above either produced a user or threw, so this branch
            // means the account vanished between the two lookups. Retry.
            throw new Error(
              `User still missing after recovery for ${paymentIntent.id}`,
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

    // Handler completed: close the idempotency gate so retries stop here.
    await supabaseAdmin
      .from("stripe_events")
      .update({ status: "processed" })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 },
    );
  }
}

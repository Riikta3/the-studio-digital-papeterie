import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { provisionFromPaymentIntent } from "@/actions/create-wedding";
import {
  adminDomainRowStore,
  ensureCustomDomainRowFromWebhook,
  startDomainPurchase,
} from "@/lib/custom-domain-row-admin";
import { findUserByEmail } from "@/lib/find-user-by-email";
import { fulfilModuleAddOn } from "@/lib/fulfil-module-addon";
import { issueInvoiceForPayment } from "@/lib/invoice";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isModuleAddOn } from "@shared/lib/module-addon";

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

/**
 * How long the recovery net waits before deciding the browser gave up.
 *
 * Provisioning takes roughly five seconds (account, wedding, settings, site,
 * modules, purchases, then the intent is stamped), and Stripe can deliver
 * `payment_intent.succeeded` before any of it has landed. Ten seconds clears
 * a normal run with room to spare while still recovering a dead tab inside a
 * single delivery.
 *
 * Well within Stripe's timeout, which is 30s per attempt.
 */
const RECOVERY_GRACE_MS = 10_000;

/**
 * The wedding this payment built, if any.
 *
 * Asked about the PAYMENT, never the account alone: a second purchase belongs
 * to an account that already has a wedding, and asking about the account
 * skipped recovery and then billed and invoiced a payment the browser
 * refunded. In order:
 * - the wedding that carries this payment (`weddings.payment_intent_id`,
 *   written by its own insert);
 * - the one this payment's claim names (`checkout_provisions`);
 * - the one the intent is stamped with (`metadata.wedding_id`), read from a
 *   fresh copy: the event's dates from the payment, before any stamp.
 * Weddings from before `payment_intent_id` existed carry none, so for an
 * account holding one of those, and only then, the account's wedding still
 * stands in for the payment's.
 */
async function weddingOfPayment(
  paymentIntentId: string,
  userId: string | undefined,
): Promise<string | null> {
  const { data: carrying } = await supabaseAdmin
    .from("weddings")
    .select("id")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (carrying) return carrying.id;

  const { data: claim } = await supabaseAdmin
    .from("checkout_provisions")
    .select("wedding_id")
    .eq("payment_intent_id", paymentIntentId)
    .not("wedding_id", "is", null)
    .maybeSingle();
  if (claim?.wedding_id) return claim.wedding_id;

  const fresh = await stripe.paymentIntents.retrieve(paymentIntentId);
  const stamped = fresh.metadata?.wedding_id;
  if (stamped) {
    const { data: wedding } = await supabaseAdmin
      .from("weddings")
      .select("id")
      .eq("id", stamped)
      .maybeSingle();
    if (wedding) return wedding.id;
  }

  if (!userId) return null;
  const { data: legacy } = await supabaseAdmin
    .from("weddings")
    .select("id")
    .eq("user_id", userId)
    .is("payment_intent_id", null)
    .limit(1)
    .maybeSingle();
  return legacy?.id ?? null;
}

/**
 * Whether this payment's order is provisioned — waiting out the browser first.
 *
 * Provisioned means this payment's wedding exists with its site.
 * `createWedding` inserts the wedding first and deletes it again should its
 * settings or site fail, so a wedding without a site is still being built or
 * about to go, and billing on it would stop the retries that rebuild it.
 *
 * Returns true as soon as that holds, so a checkout that finished long ago (a
 * Stripe redelivery, days later) costs nothing. It only pays the grace period
 * when it does not, which is either a run still in flight or a real failure —
 * and telling those two apart is the whole point.
 */
async function paymentProvisioned(
  paymentIntentId: string,
  email: string,
  user: { id: string } | undefined,
): Promise<boolean> {
  const lookup = async (userId: string | undefined) => {
    const weddingId = await weddingOfPayment(paymentIntentId, userId);
    if (!weddingId) return false;
    const { data: site } = await adminDomainRowStore.siteOf(weddingId);
    return Boolean(site);
  };

  if (await lookup(user?.id)) return true;

  await new Promise((resolve) => setTimeout(resolve, RECOVERY_GRACE_MS));

  // Re-resolve the account too: on a brand-new customer it did not exist when
  // this event arrived, and the browser will have created it during the wait.
  const settled = user ?? (await findUserByEmail(email));
  return lookup(settled?.id);
}

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

        // A module bought from the dashboard after the sale. It carries an
        // email, so it must be routed here before the checkout path below
        // could take it for an order to provision (spec D6).
        if (isModuleAddOn(paymentIntent)) {
          await fulfilModuleAddOn(paymentIntent);
          break;
        }

        const email =
          paymentIntent.metadata.email ||
          (paymentIntent.receipt_email as string);

        if (email) {
          let user = await findUserByEmail(email);

          /*
           * Safety net. Provisioning normally runs in the customer's browser
           * right after payment; if their tab died in those two seconds the
           * charge settled and nothing was created. This used to only warn.
           * Stripe retries this delivery, so the order still gets fulfilled.
           *
           * ── Why it waits, and why it asks about the wedding ──────────────
           * Stripe delivered this event one second BEFORE the browser had
           * finished writing the wedding it had already started. The net fired
           * on a healthy checkout and built a second, identical wedding — and
           * the dashboard, which resolves the couple's wedding with
           * `.single()`, then 500'd on every page.
           *
           * Two changes, because a rescue has to be sure the patient is
           * actually down:
           *
           * 1. It waits. Provisioning takes ~5s end to end, so a verdict
           *    reached at t+0 is meaningless. `GRACE_MS` buys the browser the
           *    time it needs; a genuinely dead tab is still dead afterwards
           *    and gets rescued one delivery later.
           *
           * 2. It asks whether the WEDDING exists, not the user. The account
           *    is created in the first second of provisioning and the wedding
           *    four seconds later, so "user missing" is true for a fraction of
           *    a healthy run while "wedding missing" tracks the thing we would
           *    actually be recovering. And THIS PAYMENT's wedding, not the
           *    account's (`weddingOfPayment`): a second purchase finds the
           *    account's first wedding, and was billed as a sale.
           *
           * The payment claim (`createWedding`) is what makes a mistake here
           * harmless rather than expensive: should both paths still run, the
           * second waits for the first's wedding and adopts it instead of
           * duplicating it. This grace period keeps us from relying on that
           * every time.
           */
          const provisioned = await paymentProvisioned(paymentIntent.id, email, user);

          // The account may have been created by the browser while we waited,
          // so the lookup above is stale either way. The billing upsert and
          // the invoice below both need the real user.
          if (!user) user = await findUserByEmail(email);

          if (!provisioned) {
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
            } else if (recovery.duplicatePurchase) {
              // A second purchase: the account owns another payment's
              // wedding, and `createWedding` refunded this one (or logged
              // `[REFUND_FAILED]` for a manual refund). Nothing was sold, so
              // no billing row, no invoice and no domain. Answered 200: a
              // retry would get the same answer.
              console.error(
                `[DUPLICATE_PURCHASE] ${paymentIntent.id}: second purchase by ` +
                  `${email}, not booked. ${recovery.reason}`,
              );
              break;
            } else if (recovery.inProgress) {
              // Another pass (the browser, a parallel delivery) holds this
              // payment's claim and was still building the wedding after
              // `createWedding` waited for it. Not a failure: nothing was
              // created or refunded. Throwing returns 500, so Stripe delivers
              // again, and that delivery finds the wedding — or, should the
              // other pass have died, takes its claim over once it is stale.
              console.warn(
                `[PROVISION_IN_PROGRESS] ${paymentIntent.id}: another pass is ` +
                  "still provisioning it; leaving it to Stripe's retry.",
              );
              throw new Error(
                `Provisioning still in progress for ${paymentIntent.id}`,
              );
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

          /*
           * Refunded since the payment: a second purchase the browser refused
           * while this delivery was on its way. `refundPayment` marks the
           * intent with `refunded_reason`, and only a fresh copy shows it —
           * the event's dates from the payment. Without this, an account
           * whose wedding predates `payment_intent_id` (which counts as
           * provisioned above) had its refunded second payment billed and
           * invoiced.
           */
          const current = await stripe.paymentIntents.retrieve(paymentIntent.id);
          if (current.metadata?.refunded_reason) {
            console.error(
              `[DUPLICATE_PURCHASE] ${paymentIntent.id} was refunded ` +
                `(${current.metadata.refunded_reason}); not booked.`,
            );
            break;
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

          /*
           * The custom domain's row, when this payment bought one.
           *
           * `createWedding` writes it once and never fails the order over it,
           * so a transient error there used to be final: once the wedding
           * exists, no later pass provisions again, and the couple had paid
           * for a domain with no row. This pass finds the row
           * (a replay) or writes it, for the wedding the payment is stamped
           * with — whether the browser built it or the recovery above just
           * did. An intent not stamped yet is left to the browser still
           * provisioning it.
           *
           * A failure throws, so Stripe retries the delivery, like a failed
           * recovery. It runs after the billing row and the invoice, both
           * idempotent per intent, so a domain problem never holds them back
           * and a retry does not duplicate them.
           */
          const domainRow = await ensureCustomDomainRowFromWebhook(paymentIntent);
          if (domainRow.outcome === "failed") {
            throw new Error(
              `Custom domain row still missing for ${paymentIntent.id}`,
            );
          }
          // A row this pass wrote with a name starts its purchase after the
          // response (Stripe is not kept waiting on Vercel); the cron backs it
          // up. A replay was started by whichever pass wrote it.
          startDomainPurchase(domainRow);
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

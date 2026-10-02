import type Stripe from "stripe";

import { checkAddOnIntent } from "@shared/lib/module-addon";

import { buildAddOnInvoiceLines, invoiceCustomerName } from "@/lib/addon-invoice-lines";
import { issueInvoiceForPayment } from "@/lib/invoice";
import { frenchModuleName } from "@/lib/invoice-lines";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export type AddOnFulfilment =
  | { status: "fulfilled"; granted: string[]; refundedCents: number }
  | { status: "rejected"; reason: string };

/**
 * The webhook's half of a module bought in the dashboard (spec D6): the
 * safety net for a tab closed right after paying, and the one place that
 * books, refunds and invoices.
 *
 * Every step is safe to repeat — `grant_modules` per intent, the billing
 * upsert, the refund's idempotency key, the invoice per intent — because
 * throwing makes Stripe deliver again. A payment that fails verification is
 * permanent: logged and answered, never retried.
 */
export async function fulfilModuleAddOn(intent: Stripe.PaymentIntent): Promise<AddOnFulfilment> {
  const check = checkAddOnIntent(intent);
  if (!check.ok) {
    console.error(`[ADDON_VERIFY_FAILED] ${intent.id}: ${check.reason}`);
    return { status: "rejected", reason: check.reason };
  }
  const { order } = check;

  const { data, error } = await supabaseAdmin.rpc("grant_modules", {
    p_site_id: order.siteId,
    p_modules: order.modules,
    p_payment_intent_id: intent.id,
    p_unit_price_cents: order.unitPriceCents,
  });
  if (error) throw error;
  const granted = (data as string[] | null) ?? [];

  // Two tabs paid for the same basket: what this payment could not grant is
  // already owned. Refunded before the invoice, so the invoice is the net sale.
  const notGranted = order.modules.filter((id) => !granted.includes(id));
  const refundedCents = notGranted.length * order.unitPriceCents;
  if (refundedCents > 0) {
    console.warn(`[ADDON_DOUBLE_PAYMENT] ${intent.id}: refunding ${notGranted.join(", ")}`);
    await stripe.refunds.create(
      { payment_intent: intent.id, amount: refundedCents, metadata: { reason: "modules_already_owned" } },
      { idempotencyKey: `addon-refund:${intent.id}` },
    );
  }

  const netCents = (intent.amount_received || intent.amount) - refundedCents;

  const { error: billingError } = await supabaseAdmin.from("billing").upsert(
    {
      user_id: order.userId,
      stripe_payment_intent_id: intent.id,
      amount: netCents,
      currency: intent.currency,
      status: "succeeded",
      plan_name: `Modules : ${order.modules.map(frenchModuleName).join(", ")}`,
      payment_method: intent.payment_method_types?.[0] || "unknown",
    },
    { onConflict: "stripe_payment_intent_id" },
  );
  if (billingError) {
    console.error("[BILLING_INSERT_FAILED]", intent.id, billingError);
    throw billingError;
  }

  if (granted.length > 0) {
    await issueInvoiceForPayment({
      userId: order.userId,
      email: order.email,
      paymentIntent: intent,
      content: {
        lines: buildAddOnInvoiceLines(granted, order.unitPriceCents / 100, frenchModuleName),
        customerName: invoiceCustomerName(order.firstName, order.lastName, order.partnerName),
      },
      netCents,
    });
  }

  console.log(`🧩 Modules granted by webhook for ${intent.id}: ${granted.join(", ") || "none"}`);
  return { status: "fulfilled", granted, refundedCents };
}

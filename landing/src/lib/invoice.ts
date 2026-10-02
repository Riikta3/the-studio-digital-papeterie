import type Stripe from "stripe";

import { invoiceCustomerName } from "@/lib/addon-invoice-lines";
import { VAT_RATE, VAT_REGIME, assertCompanyConfigured } from "@/lib/company";
import { type InvoiceLine, buildInvoiceLines, frenchModuleName } from "@/lib/invoice-lines";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { parseOrderMetadata } from "@/lib/order-metadata";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Issues the invoice for a settled payment.
 *
 * Called from the Stripe webhook once the billing row exists. Every sale needs
 * one (art. L441-9 code de commerce), numbered from a gapless per-year
 * sequence — hence `next_invoice_number()`, which allocates under a row lock
 * in Postgres rather than racing two concurrent webhook deliveries.
 *
 * Idempotent per PaymentIntent: `invoices.stripe_payment_intent_id` is unique,
 * so a Stripe redelivery finds the existing invoice instead of burning a
 * second number for the same sale — numbers are never reused, so a wasted one
 * leaves a permanent hole in the sequence an auditor will ask about.
 */

export interface IssueInvoiceInput {
  userId: string;
  email: string;
  paymentIntent: Stripe.PaymentIntent;
  /**
   * What was sold, when the caller knows better than the order metadata — a
   * module add-on, whose lines are the modules its payment actually granted.
   * Without it, the checkout's order is read back from the intent.
   */
  content?: { lines: InvoiceLine[]; customerName: string };
  /** The sale's final amount in cents, when part of the charge was refunded before invoicing. */
  netCents?: number;
}

/** Storage bucket holding rendered invoices (private; see the migration). */
const BUCKET = "invoices";

/** Maps Stripe's payment method ids to what the invoice should read. */
const METHOD_LABELS: Record<string, string> = {
  card: "carte bancaire",
  paypal: "PayPal",
  link: "Link",
  sepa_debit: "prélèvement SEPA",
  klarna: "Klarna",
  ideal: "iDEAL",
  bancontact: "Bancontact",
};

export async function issueInvoiceForPayment(
  input: IssueInvoiceInput,
): Promise<{ issued: boolean; invoiceNumber?: string; reason?: string }> {
  const { userId, email, paymentIntent } = input;

  // Already issued — a redelivery, not a second sale.
  const { data: existing } = await supabaseAdmin
    .from("invoices")
    .select("invoice_number")
    .eq("stripe_payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (existing) {
    return { issued: false, invoiceNumber: existing.invoice_number, reason: "already issued" };
  }

  // Refuse rather than produce a document reading "[à compléter]" where the
  // SIRET belongs: the customer would file it as a valid receipt.
  try {
    assertCompanyConfigured();
  } catch (err) {
    console.error("[INVOICE_CONFIG]", (err as Error).message);
    return { issued: false, reason: (err as Error).message };
  }

  let lines: InvoiceLine[];
  let coupleName: string;
  if (input.content) {
    lines = input.content.lines;
    coupleName = input.content.customerName;
  } else {
    const order = parseOrderMetadata(paymentIntent);
    if (!order) {
      return { issued: false, reason: "no order metadata on intent" };
    }
    lines = buildInvoiceLines(order, frenchModuleName);
    coupleName = invoiceCustomerName(order.firstName, order.lastName, order.partnerName);
  }
  if (lines.length === 0) {
    return { issued: false, reason: "nothing to invoice" };
  }

  const linesTotal = lines.reduce((sum, line) => sum + line.total, 0);

  // Reconcile against what was actually charged — net of a refund made before
  // invoicing (an add-on paid twice, spec D6). A mismatch means the pricing
  // rules moved since the payment: issuing an invoice for a different amount
  // than the money taken is the one error that must never reach a customer.
  const chargedEuros =
    (input.netCents ?? (paymentIntent.amount_received || paymentIntent.amount)) / 100;
  if (Math.abs(linesTotal - chargedEuros) > 0.01) {
    console.error(
      `[INVOICE_TOTAL_MISMATCH] ${paymentIntent.id}: lines ${linesTotal}€ vs charged ${chargedEuros}€`,
    );
    return { issued: false, reason: "line items do not reconcile with the charge" };
  }

  // Under the franchise en base no VAT is charged and the total is the
  // subtotal; under the standard regime the displayed prices are VAT-inclusive.
  const total = chargedEuros;
  const subtotal =
    VAT_REGIME === "standard" ? total / (1 + VAT_RATE) : total;
  const vat = total - subtotal;

  // Allocate last: a number handed out then abandoned leaves a gap.
  const { data: numberData, error: numberError } = await supabaseAdmin.rpc(
    "next_invoice_number",
  );

  if (numberError || !numberData) {
    console.error("[INVOICE_NUMBER_FAILED]", numberError);
    throw numberError ?? new Error("Could not allocate an invoice number.");
  }

  const invoiceNumber = numberData as string;
  const issuedAt = new Date();

  const methodId = paymentIntent.payment_method_types?.[0] ?? "card";

  const pdfBytes = await renderInvoicePdf({
    invoiceNumber,
    issuedAt,
    customerName: coupleName || undefined,
    customerEmail: email,
    lines,
    subtotal,
    vat,
    total,
    paymentMethod: METHOD_LABELS[methodId] ?? methodId,
  });

  // Keyed by user id so the storage policy can scope a couple to their own.
  const pdfPath = `${userId}/${invoiceNumber}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pdfPath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    // The row is still written below: an invoice number was allocated and must
    // stay accounted for. The PDF can be re-rendered from `line_items`.
    console.error("[INVOICE_UPLOAD_FAILED]", invoiceNumber, uploadError);
  }

  const { error: insertError } = await supabaseAdmin.from("invoices").insert({
    user_id: userId,
    stripe_payment_intent_id: paymentIntent.id,
    invoice_number: invoiceNumber,
    issued_at: issuedAt.toISOString(),
    total_cents: Math.round(total * 100),
    subtotal_cents: Math.round(subtotal * 100),
    vat_cents: Math.round(vat * 100),
    vat_rate: VAT_REGIME === "standard" ? VAT_RATE : 0,
    currency: paymentIntent.currency ?? "eur",
    customer_email: email,
    customer_name: coupleName || null,
    line_items: lines,
    pdf_path: uploadError ? null : pdfPath,
  });

  if (insertError) {
    console.error("[INVOICE_INSERT_FAILED]", invoiceNumber, insertError);
    throw insertError;
  }

  // Mirrored onto the billing row so the dashboard's existing billing view can
  // link the document without a second query.
  await supabaseAdmin
    .from("billing")
    .update({ invoice_url: pdfPath })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  console.log(`🧾 Invoice ${invoiceNumber} issued for ${email}`);

  return { issued: true, invoiceNumber };
}

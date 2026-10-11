import { after } from "next/server";
import type Stripe from "stripe";

import {
  domainRowToStart,
  ensureCustomDomainRowForIntent,
  type CustomDomainRowResult,
  type DomainRowStore,
} from "@/lib/custom-domain-row";
import { advanceCustomDomainSafely } from "@/lib/custom-domains/engine";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * The service-role side of `custom-domain-row.ts`, kept apart so that module
 * stays testable with fakes.
 *
 * Server only, and never behind `"use server"`: it bypasses RLS, and
 * `custom_domains` has no write policy at all — every write goes through the
 * service role once the server has checked the payment (spec D2).
 */
export const adminDomainRowStore: DomainRowStore = {
  siteOf: (weddingId) =>
    supabaseAdmin.from("sites").select("id").eq("wedding_id", weddingId).maybeSingle(),
  insert: (row) => supabaseAdmin.from("custom_domains").insert(row).select("id").single(),
};

/**
 * Starts buying the domain of a row this pass has just written with a name,
 * once the response is sent; does nothing for any other outcome.
 *
 * `after()`, because the couple's redirect to their dashboard must not wait
 * on Vercel (a purchase step can take tens of seconds). The 5-minute cron is
 * the safety net: a step that never runs, or dies, is picked up there.
 *
 * Never throws. `after()` does outside a request; failing a paid order over
 * that would be far worse than leaving the row to the cron.
 */
export function startDomainPurchase(result: CustomDomainRowResult | { outcome: "unprovisioned" }): void {
  const id = domainRowToStart(result);
  if (!id) return;
  try {
    after(() => advanceCustomDomainSafely(id));
  } catch (error) {
    console.warn("[DOMAIN_ADVANCE_NOT_SCHEDULED] left to the cron", { id }, error);
  }
}

/** The webhook's pass over a paid checkout: writes the domain row if it is still missing. */
export function ensureCustomDomainRowFromWebhook(intent: Stripe.PaymentIntent) {
  return ensureCustomDomainRowForIntent(intent, {
    store: adminDomainRowStore,
    retrieveIntent: (id) => stripe.paymentIntents.retrieve(id),
  });
}

"use server";

import { DAY_OF_MODULE, getModuleName } from "@shared/data/modules";
import { knownModuleIds, splitUnpaid } from "@shared/lib/addable-modules";
import {
  type AddOnOrder,
  buildAddOnMetadata,
  checkAddOnIntent,
  isReusableIntent,
  isUnsettledAddOn,
} from "@shared/lib/module-addon";
import { dayOfIncluded } from "@shared/lib/day-of-access";
import { EXTRA_MODULE_PRICE, addOnQuote, countedModules } from "@shared/lib/pricing";
import { getTranslations } from "next-intl/server";

import type { ModuleLists } from "@/components/editor/types";
import { requireWedding } from "@/lib/db/current-wedding";
import { stripe, toCents } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Paying for the modules a couple added in the editor
 * (docs/superpowers/specs/2026-09-28-dashboard-module-purchase-design.md, D4, D5).
 *
 * Everything runs under the couple's session except `grant_modules`, which
 * makes a module live and therefore runs with the service role — after Stripe
 * has confirmed the money, or for what the plan includes.
 */

type Db = Awaited<ReturnType<typeof requireWedding>>["supabase"];

async function coupleSite() {
  const { supabase, user, weddingId } = await requireWedding();
  const { data: site, error } = await supabase
    .from("sites")
    .select("id, plan_id, theme_id, modules, pending_modules")
    .eq("wedding_id", weddingId)
    .single();
  if (error || !site) throw new Error("Site not found");
  return { supabase, user, weddingId, site };
}

async function currentLists(db: Db, siteId: string): Promise<ModuleLists> {
  const { data, error } = await db.from("sites").select("modules, pending_modules").eq("id", siteId).single();
  if (error || !data) throw new Error("Site not found");
  const owned = knownModuleIds((data.modules as string[] | null) ?? []);
  const pending = knownModuleIds((data.pending_modules as string[] | null) ?? []).filter(
    (id) => !owned.includes(id),
  );
  return { owned, pending };
}

async function grant(siteId: string, modules: string[], paymentIntentId?: string, unitPriceCents = 0) {
  const { data, error } = await supabaseAdmin.rpc("grant_modules", {
    p_site_id: siteId,
    p_modules: modules,
    ...(paymentIntentId ? { p_payment_intent_id: paymentIntentId } : {}),
    p_unit_price_cents: unitPriceCents,
  });
  if (error) throw error;
  return (data as string[] | null) ?? [];
}

/** By the account's email, as the checkout does: `profiles.stripe_customer_id` is the couple's to write. */
async function customerFor(email: string): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  return existing.data[0]?.id ?? (await stripe.customers.create({ email })).id;
}

export type ModulePaymentStart =
  | { ok: true; kind: "pay"; clientSecret: string; modules: string[]; amountCents: number }
  | { ok: true; kind: "nothing"; modules: ModuleLists }
  /** A payment Stripe had already taken is now granted: nothing to charge this time. */
  | { ok: true; kind: "settled"; modules: ModuleLists }
  /** A payment for these modules is still on its way: wait for it rather than pay twice. */
  | { ok: true; kind: "confirming" }
  | { ok: false; error: string };

/** Prices the unpaid modules and opens (or reuses) the PaymentIntent for them. */
export async function startModulePayment(locale: string): Promise<ModulePaymentStart> {
  try {
    const { supabase, user, weddingId, site } = await coupleSite();
    const owned = (site.modules as string[] | null) ?? [];
    const { free, billable } = splitUnpaid(
      site.plan_id,
      owned,
      (site.pending_modules as string[] | null) ?? [],
      site.theme_id,
    );

    if (free.length > 0) await grant(site.id, free);
    if (billable.length === 0) {
      return { ok: true, kind: "nothing", modules: await currentLists(supabase, site.id) };
    }

    const email = user.email?.trim();
    if (!email) return { ok: false, error: "no-email" };

    const [{ data: profile }, t] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name, partner_name").eq("id", user.id).maybeSingle(),
      getTranslations({ locale: "fr", namespace: "Modules" }),
    ]);

    const unitPriceCents = toCents(EXTRA_MODULE_PRICE);
    const order: AddOnOrder = {
      weddingId,
      siteId: site.id,
      userId: user.id,
      modules: billable,
      unitPriceCents,
      amountCents: billable.length * unitPriceCents,
      planId: site.plan_id ?? "",
      email,
      firstName: profile?.first_name ?? undefined,
      lastName: profile?.last_name ?? undefined,
      partnerName: profile?.partner_name ?? undefined,
      locale,
    };

    const customer = await customerFor(email);
    const recent = await stripe.paymentIntents.list({ customer, limit: 20 });

    // Stripe already has the money for some of these modules — the fast path
    // failed and the webhook has not run yet: finish that payment rather than
    // take a second one.
    const unsettled = recent.data.find((candidate) => isUnsettledAddOn(candidate, { siteId: site.id, owned }));
    if (unsettled?.status === "processing") return { ok: true, kind: "confirming" };
    if (unsettled) {
      const check = checkAddOnIntent(unsettled, { siteId: site.id });
      if (check.ok) {
        await grant(site.id, check.order.modules, unsettled.id, check.order.unitPriceCents);
        return { ok: true, kind: "settled", modules: await currentLists(supabase, site.id) };
      }
    }

    // Reopening the dialog must not leave a trail of abandoned intents.
    const intent =
      recent.data.find((candidate) => isReusableIntent(candidate, order)) ??
      (await stripe.paymentIntents.create({
        amount: order.amountCents,
        currency: "eur",
        customer,
        receipt_email: email,
        automatic_payment_methods: { enabled: true },
        description: `Modules supplémentaires : ${billable.map((id) => getModuleName(t, id)).join(", ")}`,
        metadata: buildAddOnMetadata(order),
      }));

    if (!intent.client_secret) throw new Error(`No client secret on ${intent.id}`);
    return {
      ok: true,
      kind: "pay",
      clientSecret: intent.client_secret,
      modules: billable,
      amountCents: order.amountCents,
    };
  } catch (error) {
    console.error("[MODULE_PAYMENT_START]", error);
    return { ok: false, error: "unavailable" };
  }
}

export type ModulePaymentResult =
  | { ok: true; status: "granted" | "already-owned"; modules: ModuleLists }
  | { ok: true; status: "processing" }
  | { ok: false; error: string };

/**
 * The fast path, right after `confirmPayment` or on return from PayPal/Klarna.
 * The webhook does the same and invoices; whichever runs second changes nothing.
 */
export async function completeModulePayment(paymentIntentId: string): Promise<ModulePaymentResult> {
  try {
    if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) return { ok: false, error: "unknown" };

    const { supabase, site } = await coupleSite();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status === "processing") return { ok: true, status: "processing" };

    const check = checkAddOnIntent(intent, { siteId: site.id });
    if (!check.ok) {
      console.error(`[ADDON_VERIFY_FAILED] ${paymentIntentId}: ${check.reason}`);
      return { ok: false, error: "unverified" };
    }

    const granted = await grant(site.id, check.order.modules, intent.id, check.order.unitPriceCents);
    return {
      ok: true,
      status: granted.length > 0 ? "granted" : "already-owned",
      modules: await currentLists(supabase, site.id),
    };
  } catch (error) {
    console.error("[MODULE_PAYMENT_COMPLETE]", error);
    return { ok: false, error: "unavailable" };
  }
}

/** « Retirer ce module » on a saved, unpaid module: its config and its place in the list go. */
export async function removePendingModule(
  moduleId: string,
): Promise<{ ok: true; modules: ModuleLists } | { ok: false }> {
  try {
    const { supabase, site } = await coupleSite();
    const pending = (site.pending_modules as string[] | null) ?? [];
    if (!pending.includes(moduleId)) return { ok: false };

    const { error: rowError } = await supabase
      .from("site_modules")
      .delete()
      .eq("site_id", site.id)
      .eq("module_id", moduleId);
    if (rowError) throw rowError;

    const { error } = await supabase
      .from("sites")
      .update({ pending_modules: pending.filter((id) => id !== moduleId) })
      .eq("id", site.id);
    if (error) throw error;

    return { ok: true, modules: await currentLists(supabase, site.id) };
  } catch (error) {
    console.error("[MODULE_REMOVE_PENDING]", error);
    return { ok: false };
  }
}

export type DayOfPaymentStart =
  | { ok: true; kind: "pay"; clientSecret: string; amountCents: number }
  | { ok: true; kind: "granted" }
  | { ok: true; kind: "confirming" }
  | { ok: false; error: string };

/**
 * Buys « Trouve ta place » from the Jour J screen: granted at once when the
 * plan includes it or Signature still has a free slot, otherwise a 5 € add-on
 * intent for that module alone. It never goes through `pending_modules`, which
 * the editor reads: an abandoned Jour J payment must not show up there.
 *
 * Paid like any add-on, so `completeModulePayment` and the landing's webhook
 * grant it the same way.
 */
export async function startDayOfPayment(locale: string): Promise<DayOfPaymentStart> {
  try {
    const { supabase, user, weddingId, site } = await coupleSite();
    const owned = (site.modules as string[] | null) ?? [];
    const { data: siteRow } = await supabase
      .from("sites")
      .select("plan_id, modules, created_at")
      .eq("id", site.id)
      .single();
    if (dayOfIncluded(siteRow ?? null, false)) {
      if (!owned.includes(DAY_OF_MODULE)) await grant(site.id, [DAY_OF_MODULE]);
      return { ok: true, kind: "granted" };
    }

    // `grant_modules` skips ids missing from the registry: until migration
    // 20261004200000 has run, refuse rather than take 5 € for nothing.
    const { data: registered } = await supabase
      .from("modules")
      .select("id")
      .eq("id", DAY_OF_MODULE)
      .maybeSingle();
    if (!registered) return { ok: false, error: "unavailable" };

    if (addOnQuote(site.plan_id, countedModules(owned), 1).billable === 0) {
      await grant(site.id, [DAY_OF_MODULE]);
      return { ok: true, kind: "granted" };
    }

    const email = user.email?.trim();
    if (!email) return { ok: false, error: "no-email" };

    const [{ data: profile }, t] = await Promise.all([
      supabase.from("profiles").select("first_name, last_name, partner_name").eq("id", user.id).maybeSingle(),
      getTranslations({ locale: "fr", namespace: "Modules" }),
    ]);

    const unitPriceCents = toCents(EXTRA_MODULE_PRICE);
    const order: AddOnOrder = {
      weddingId,
      siteId: site.id,
      userId: user.id,
      modules: [DAY_OF_MODULE],
      unitPriceCents,
      amountCents: unitPriceCents,
      planId: site.plan_id ?? "",
      email,
      firstName: profile?.first_name ?? undefined,
      lastName: profile?.last_name ?? undefined,
      partnerName: profile?.partner_name ?? undefined,
      locale,
    };

    const customer = await customerFor(email);
    const recent = await stripe.paymentIntents.list({ customer, limit: 20 });

    // Paid but not granted yet (the tab closed before the fast path): grant now.
    const unsettled = recent.data.find(
      (candidate) =>
        isUnsettledAddOn(candidate, { siteId: site.id, owned }) &&
        candidate.metadata?.modules === DAY_OF_MODULE,
    );
    if (unsettled?.status === "processing") return { ok: true, kind: "confirming" };
    if (unsettled) {
      const check = checkAddOnIntent(unsettled, { siteId: site.id });
      if (check.ok) {
        await grant(site.id, check.order.modules, unsettled.id, check.order.unitPriceCents);
        return { ok: true, kind: "granted" };
      }
    }

    const intent =
      recent.data.find((candidate) => isReusableIntent(candidate, order)) ??
      (await stripe.paymentIntents.create({
        amount: order.amountCents,
        currency: "eur",
        customer,
        receipt_email: email,
        automatic_payment_methods: { enabled: true },
        description: `Module supplémentaire : ${getModuleName(t, DAY_OF_MODULE)}`,
        metadata: buildAddOnMetadata(order),
      }));

    if (!intent.client_secret) throw new Error(`No client secret on ${intent.id}`);
    return { ok: true, kind: "pay", clientSecret: intent.client_secret, amountCents: order.amountCents };
  } catch (error) {
    console.error("[DAY_OF_PAYMENT_START]", error);
    return { ok: false, error: "unavailable" };
  }
}

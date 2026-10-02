import type Stripe from "stripe";

/**
 * A module bought from the dashboard after the sale, as carried on its Stripe
 * PaymentIntent (docs/superpowers/specs/2026-09-28-dashboard-module-purchase-design.md, D4).
 *
 * Written by the dashboard's `startModulePayment`, read back by its fast path
 * and by the landing's webhook. Metadata is set with the secret key and cannot
 * be changed from a browser, so the amounts written here are the ones to
 * check the payment against.
 *
 * Deliberately no `plan` key: that key is how the webhook recognises a
 * checkout, and an add-on must never be provisioned as one.
 */
export const MODULE_ADDON_KIND = "module_addon";

export interface AddOnOrder {
  weddingId: string;
  siteId: string;
  userId: string;
  /** The billable modules, in the order they were added. */
  modules: string[];
  unitPriceCents: number;
  amountCents: number;
  planId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  partnerName?: string;
  locale?: string;
}

/** Stripe rejects metadata values longer than this. */
const MAX_VALUE_LENGTH = 500;
const clamp = (value: string) => value.slice(0, MAX_VALUE_LENGTH);

export function buildAddOnMetadata(order: AddOnOrder): Record<string, string> {
  const entries: Record<string, string> = {
    kind: MODULE_ADDON_KIND,
    wedding_id: order.weddingId,
    site_id: order.siteId,
    user_id: order.userId,
    modules: clamp(order.modules.join(",")),
    unit_price_cents: String(order.unitPriceCents),
    amount_cents: String(order.amountCents),
    plan_id: clamp(order.planId),
    email: clamp(order.email),
  };

  const optional: Record<string, string | undefined> = {
    first_name: order.firstName,
    last_name: order.lastName,
    partner_name: order.partnerName,
    locale: order.locale,
  };
  for (const [key, value] of Object.entries(optional)) {
    const trimmed = value?.trim();
    if (trimmed) entries[key] = clamp(trimmed);
  }

  return entries;
}

export function isModuleAddOn(intent: { metadata?: Record<string, string> | null }): boolean {
  return intent.metadata?.kind === MODULE_ADDON_KIND;
}

const cents = (value: string | undefined) => (value && /^\d+$/.test(value) ? Number(value) : Number.NaN);

type IntentMetadata = Pick<Stripe.PaymentIntent, "metadata"> &
  Partial<Pick<Stripe.PaymentIntent, "receipt_email">>;

/** The order an add-on intent carries, or null when it is not one or is incomplete. */
export function parseAddOnMetadata(intent: IntentMetadata): AddOnOrder | null {
  const meta = (intent.metadata ?? {}) as Record<string, string | undefined>;
  if (meta.kind !== MODULE_ADDON_KIND) return null;

  const modules = (meta.modules ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const unitPriceCents = cents(meta.unit_price_cents);
  const amountCents = cents(meta.amount_cents);
  const email = (meta.email || intent.receipt_email || "").trim();

  if (
    !meta.wedding_id ||
    !meta.site_id ||
    !meta.user_id ||
    modules.length === 0 ||
    !Number.isFinite(unitPriceCents) ||
    !Number.isFinite(amountCents) ||
    !email
  ) {
    return null;
  }

  return {
    weddingId: meta.wedding_id,
    siteId: meta.site_id,
    userId: meta.user_id,
    modules,
    unitPriceCents,
    amountCents,
    planId: meta.plan_id ?? "",
    email,
    firstName: meta.first_name,
    lastName: meta.last_name,
    partnerName: meta.partner_name,
    locale: meta.locale,
  };
}

export type AddOnCheck = { ok: true; order: AddOnOrder } | { ok: false; reason: string };

type CheckableIntent = Pick<Stripe.PaymentIntent, "status" | "metadata" | "currency" | "amount_received"> &
  Partial<Pick<Stripe.PaymentIntent, "receipt_email">>;

/**
 * Whether a payment can be turned into modules: settled, an add-on, for this
 * site when one is expected, in euros, and paid in full for what it names.
 */
export function checkAddOnIntent(intent: CheckableIntent, expected: { siteId?: string } = {}): AddOnCheck {
  if (intent.status !== "succeeded") return { ok: false, reason: `status ${intent.status}` };

  const order = parseAddOnMetadata(intent);
  if (!order) return { ok: false, reason: "not a module add-on, or incomplete metadata" };
  if (expected.siteId && order.siteId !== expected.siteId) {
    return { ok: false, reason: "another site's payment" };
  }
  if (intent.currency !== "eur") return { ok: false, reason: `currency ${intent.currency}` };
  if (order.amountCents !== order.modules.length * order.unitPriceCents) {
    return { ok: false, reason: "amount does not match the modules" };
  }
  if (intent.amount_received !== order.amountCents) {
    return { ok: false, reason: `received ${intent.amount_received}, expected ${order.amountCents}` };
  }

  return { ok: true, order };
}

const TAKEN: ReadonlySet<string> = new Set(["succeeded", "processing"]);

/**
 * A payment Stripe has taken, or is taking, for modules of this site that are
 * not live yet: its fast path failed and the webhook has not run. Charging for
 * those modules again would take the couple's money twice.
 */
export function isUnsettledAddOn(
  intent: Pick<Stripe.PaymentIntent, "status" | "metadata">,
  site: { siteId: string; owned: readonly string[] },
): boolean {
  if (!TAKEN.has(intent.status)) return false;
  const order = parseAddOnMetadata(intent);
  return order !== null && order.siteId === site.siteId && order.modules.some((id) => !site.owned.includes(id));
}

const REUSABLE: ReadonlySet<string> = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/** An open intent for exactly this basket — reopening the dialog reuses it instead of minting another. */
export function isReusableIntent(
  intent: Pick<Stripe.PaymentIntent, "status" | "metadata" | "amount" | "currency">,
  order: Pick<AddOnOrder, "siteId" | "modules" | "amountCents">,
): boolean {
  return (
    REUSABLE.has(intent.status) &&
    intent.metadata?.kind === MODULE_ADDON_KIND &&
    intent.metadata.site_id === order.siteId &&
    intent.metadata.modules === order.modules.join(",") &&
    intent.amount === order.amountCents &&
    intent.currency === "eur"
  );
}

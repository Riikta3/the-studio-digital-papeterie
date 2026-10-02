import type Stripe from "stripe";

import { DOMAIN_TLD, isValidLabel } from "./custom-domain";
import { domainPrice, parseDomainYears } from "./pricing";

/**
 * A custom domain bought from the dashboard after the sale, as carried on its
 * Stripe PaymentIntent (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D4).
 *
 * Built on the module add-on's pattern (`module-addon.ts`): written by the
 * dashboard's `startDomainPayment`, read back by its fast path and by the
 * landing's webhook. Metadata is set with the secret key and cannot be changed
 * from a browser, so the name, years and amount written here are the ones the
 * studio buys and checks the payment against — never what the browser sends
 * after paying.
 *
 * Deliberately no `plan` key: that key is how the webhook recognises a
 * checkout, and an add-on must never be provisioned as one.
 */
export const DOMAIN_ADDON_KIND = "domain_addon";

export interface DomainAddOnOrder {
  weddingId: string;
  siteId: string;
  userId: string;
  /** The full name, `label.com`, exactly as it will be bought. */
  domainName: string;
  /** Years of registration, from `domainYearsFor` when the intent was created. */
  domainYears: number;
  amountCents: number;
  email: string;
  firstName?: string;
  lastName?: string;
  partnerName?: string;
  locale?: string;
}

/** Stripe rejects metadata values longer than this. */
const MAX_VALUE_LENGTH = 500;
const clamp = (value: string) => value.slice(0, MAX_VALUE_LENGTH);

export function buildDomainAddOnMetadata(order: DomainAddOnOrder): Record<string, string> {
  const entries: Record<string, string> = {
    kind: DOMAIN_ADDON_KIND,
    wedding_id: order.weddingId,
    site_id: order.siteId,
    user_id: order.userId,
    // Not clamped: a valid name is at most 67 characters, and a cut one would
    // be refused on the way back rather than bought.
    domain_name: order.domainName,
    domain_years: String(order.domainYears),
    amount_cents: String(order.amountCents),
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

export function isDomainAddOn(intent: { metadata?: Record<string, string> | null }): boolean {
  return intent.metadata?.kind === DOMAIN_ADDON_KIND;
}

const cents = (value: string | undefined) => (value && /^\d+$/.test(value) ? Number(value) : Number.NaN);

const SOLD_SUFFIX = `.${DOMAIN_TLD}`;

/** A name the studio sells: a valid, normalised label followed by `.com`. */
function isSellableDomainName(name: string | undefined): name is string {
  return !!name && name.endsWith(SOLD_SUFFIX) && isValidLabel(name.slice(0, -SOLD_SUFFIX.length));
}

type IntentMetadata = Pick<Stripe.PaymentIntent, "metadata"> &
  Partial<Pick<Stripe.PaymentIntent, "receipt_email">>;

/** The order a domain add-on intent carries, or null when it is not one or is incomplete. */
export function parseDomainAddOnMetadata(intent: IntentMetadata): DomainAddOnOrder | null {
  const meta = (intent.metadata ?? {}) as Record<string, string | undefined>;
  if (meta.kind !== DOMAIN_ADDON_KIND) return null;

  // The checkout's own reader of the same key: one rule for "how many years".
  const domainYears = parseDomainYears(meta.domain_years);
  const amountCents = cents(meta.amount_cents);
  const email = (meta.email || intent.receipt_email || "").trim();

  if (
    !meta.wedding_id ||
    !meta.site_id ||
    !meta.user_id ||
    !isSellableDomainName(meta.domain_name) ||
    domainYears === null ||
    !Number.isFinite(amountCents) ||
    !email
  ) {
    return null;
  }

  return {
    weddingId: meta.wedding_id,
    siteId: meta.site_id,
    userId: meta.user_id,
    domainName: meta.domain_name,
    domainYears,
    amountCents,
    email,
    firstName: meta.first_name,
    lastName: meta.last_name,
    partnerName: meta.partner_name,
    locale: meta.locale,
  };
}

export type DomainAddOnCheck = { ok: true; order: DomainAddOnOrder } | { ok: false; reason: string };

type CheckableIntent = Pick<Stripe.PaymentIntent, "status" | "metadata" | "currency" | "amount_received"> &
  Partial<Pick<Stripe.PaymentIntent, "receipt_email">>;

/**
 * Whether a payment can be turned into a domain: settled, a domain add-on,
 * for this site when one is expected, in euros, priced by the studio's rule
 * for the years it names, and paid in full.
 */
export function checkDomainAddOnIntent(
  intent: CheckableIntent,
  expected: { siteId?: string } = {},
): DomainAddOnCheck {
  if (intent.status !== "succeeded") return { ok: false, reason: `status ${intent.status}` };

  const order = parseDomainAddOnMetadata(intent);
  if (!order) return { ok: false, reason: "not a domain add-on, or incomplete metadata" };
  if (expected.siteId && order.siteId !== expected.siteId) {
    return { ok: false, reason: "another site's payment" };
  }
  if (intent.currency !== "eur") return { ok: false, reason: `currency ${intent.currency}` };
  if (order.amountCents !== domainPrice(order.domainYears) * 100) {
    return { ok: false, reason: "amount does not match the years" };
  }
  if (intent.amount_received !== order.amountCents) {
    return { ok: false, reason: `received ${intent.amount_received}, expected ${order.amountCents}` };
  }

  return { ok: true, order };
}

const TAKEN: ReadonlySet<string> = new Set(["succeeded", "processing"]);

/**
 * A domain payment Stripe has taken, or is taking, for this site: its fast
 * path failed or has not run yet, and the webhook has not inserted the row.
 * `startDomainPayment` only checks that the site has no `custom_domains` row,
 * so without this a couple reopening the dialog in that window would be
 * charged a second time. Mirrors `module-addon.ts`'s `isUnsettledAddOn`; a
 * domain has no "owned" list to compare, since one site holds one domain.
 */
export function isUnsettledDomainAddOn(
  intent: Pick<Stripe.PaymentIntent, "status" | "metadata">,
  site: { siteId: string },
): boolean {
  if (!TAKEN.has(intent.status)) return false;
  const order = parseDomainAddOnMetadata(intent);
  return order !== null && order.siteId === site.siteId;
}

const REUSABLE: ReadonlySet<string> = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/**
 * An open intent for exactly this name, years and site — reopening the dialog
 * reuses it instead of minting another. A different name, or different years
 * because the couple came back once the wedding was closer, needs a new one.
 */
export function isReusableDomainIntent(
  intent: Pick<Stripe.PaymentIntent, "status" | "metadata" | "amount" | "currency">,
  order: Pick<DomainAddOnOrder, "siteId" | "domainName" | "domainYears" | "amountCents">,
): boolean {
  return (
    REUSABLE.has(intent.status) &&
    intent.metadata?.kind === DOMAIN_ADDON_KIND &&
    intent.metadata.site_id === order.siteId &&
    intent.metadata.domain_name === order.domainName &&
    intent.metadata.domain_years === String(order.domainYears) &&
    intent.amount === order.amountCents &&
    intent.currency === "eur"
  );
}

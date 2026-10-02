import type Stripe from "stripe";

import { parseDomainYears } from "@/lib/pricing";
import { DOMAIN_TLD, isValidLabel } from "@shared/lib/custom-domain";

/**
 * The order, as carried on the Stripe PaymentIntent.
 *
 * Stripe metadata is the only copy of an order that survives the customer's
 * browser. Provisioning used to run exclusively client-side, so the intent
 * only needed enough to reprice the cart; the couple's names and wedding date
 * lived in the Zustand store and died with the tab. That made a paid order
 * impossible to fulfil server-side — the webhook knew what was bought but not
 * who for.
 *
 * Everything `createWedding()` needs is therefore written here at intent
 * creation, and read back by the webhook when the browser never finishes.
 *
 * Stripe caps metadata at 50 keys, and each value at 500 characters. Values
 * must be strings, so lists are comma-joined and booleans are "1" / absent.
 */

/** Stripe rejects metadata values longer than this. */
const MAX_VALUE_LENGTH = 500;

export interface OrderMetadataInput {
  plan: string;
  modules: string[];
  languages: string[];
  extras: string[];
  email?: string;
  themeId?: string;
  animationId?: string;
  adultsOnly?: boolean;
  firstName?: string;
  lastName?: string;
  partnerName?: string;
  /** ISO date (YYYY-MM-DD), or undefined when the couple skipped it. */
  weddingDate?: string;
  /** Free text as typed in the studio — "Domaine des Hauts Vents". */
  venue?: string;
  locale?: string;
  /**
   * The custom domain's full name, `label.com`, once the server has
   * normalised and checked it. Absent for « plus tard ».
   * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3)
   */
  domainName?: string;
  /**
   * Registration years for the custom domain, computed by the payment route
   * from the wedding date — never the browser's figure. Written only when the
   * order has the domain; provisioning, the webhook and the invoice all read
   * it back from here rather than recomputing it from a later "today" (D1).
   */
  domainYears?: number;
}

/** Trims to Stripe's per-value limit rather than letting the API reject it. */
function clamp(value: string): string {
  return value.slice(0, MAX_VALUE_LENGTH);
}

/** Builds the flat string map Stripe stores on the intent. */
export function buildOrderMetadata(
  input: OrderMetadataInput,
): Record<string, string> {
  const entries: Record<string, string> = {
    plan: clamp(String(input.plan)),
    modules: clamp((input.modules ?? []).join(",")),
    languages: clamp((input.languages ?? []).join(",")),
    extras: clamp((input.extras ?? []).join(",")),
  };

  // Optional keys are omitted rather than written empty: an absent key and an
  // empty string read back the same way, and omitting keeps us clear of the
  // 50-key ceiling.
  const optional: Record<string, string | undefined> = {
    email: input.email,
    theme_id: input.themeId,
    animation_id: input.animationId,
    first_name: input.firstName,
    last_name: input.lastName,
    partner_name: input.partnerName,
    wedding_date: input.weddingDate,
    venue: input.venue,
    locale: input.locale,
    domain_name: input.domainName,
  };

  for (const [key, value] of Object.entries(optional)) {
    const trimmed = value?.trim();
    if (trimmed) entries[key] = clamp(trimmed);
  }

  if (input.adultsOnly) entries.adults_only = "1";

  // Only a number of years the registry sells is written: anything else
  // would be read back as 1 anyway, and the amount charged would then
  // describe a registration the metadata does not.
  const domainYears = parseDomainYears(input.domainYears);
  if (domainYears !== null) entries.domain_years = String(domainYears);

  return entries;
}

/**
 * Keys our server adds to a checkout intent after creating it, which a
 * reprice must never clear: `wedding_id` (markPaymentProvisioned, the replay
 * guard) and `refunded_reason` (refundPayment, the refund guard). Both live in
 * `verify-payment.ts`; they are the only other `paymentIntents.update` calls
 * on a checkout intent. A new one belongs here too.
 */
export const SERVER_WRITTEN_KEYS: ReadonlySet<string> = new Set([
  "wedding_id",
  "refunded_reason",
]);

/**
 * The metadata to send when repricing an existing intent.
 *
 * Stripe merges metadata on update rather than replacing it, and
 * `buildOrderMetadata` omits empty keys. A couple who switched from a chosen
 * domain name to « plus tard » therefore kept the old `domain_name` on the
 * intent, and provisioning would have bought a name they had dropped. The
 * same was true of every optional key (a venue erased, adults-only turned
 * off). So every key the existing intent has and `next` lacks is sent as "",
 * which Stripe deletes — except the keys the server writes after creation
 * (SERVER_WRITTEN_KEYS), which are not the order's to clear.
 */
export function metadataForUpdate(
  existing: Record<string, string>,
  next: Record<string, string>,
): Record<string, string> {
  const update: Record<string, string> = { ...next };
  for (const key of Object.keys(existing ?? {})) {
    if (!(key in next) && !SERVER_WRITTEN_KEYS.has(key)) update[key] = "";
  }
  return update;
}

const SOLD_SUFFIX = `.${DOMAIN_TLD}`;

/** The custom domain an intent was paid for, as provisioning reads it. */
export interface IntentDomain {
  /** The intent's own `extras` list holds "custom-domain". */
  has: boolean;
  /** `label.com`, when one was chosen and is still a name the studio sells. */
  name?: string;
  /** The years paid for; 1 when the intent does not say, or says nonsense. */
  years: number;
}

/**
 * Reads the custom domain off a PaymentIntent's metadata — the only source
 * provisioning, the webhook and the invoice accept for it (D1, D3). The
 * browser's payload after payment is never consulted: it can say anything.
 *
 * Each field is read on its own rules, so a tampered or malformed value
 * degrades to the safe reading instead of failing a paid order:
 * - `has` comes from the intent's extras, which priced the charge;
 * - a name that is not a valid label followed by `.com` reads as no name, so
 *   the couple is asked to choose rather than the studio buying it;
 * - years that are not a whole number from 1 to 10 read as 1, matching what
 *   `computeOrderTotal` charges for them.
 */
export function domainFromIntentMetadata(
  meta: Record<string, string | undefined> | null | undefined,
): IntentDomain {
  const metadata = meta ?? {};
  const name = metadata.domain_name;
  const sellable =
    !!name &&
    name.endsWith(SOLD_SUFFIX) &&
    isValidLabel(name.slice(0, -SOLD_SUFFIX.length));

  return {
    has: splitList(metadata.extras).includes("custom-domain"),
    name: sellable ? name : undefined,
    years: parseDomainYears(metadata.domain_years) ?? 1,
  };
}

/** The order as `createWedding()` consumes it. */
export interface ParsedOrder {
  plan: string;
  modules: string[];
  languages: string[];
  extras: string[];
  email: string;
  themeId: string;
  animationId: string;
  adultsOnly: boolean;
  firstName: string;
  lastName: string;
  partnerName: string;
  weddingDate?: string;
  venue?: string;
  locale?: string;
  /** Read with `domainFromIntentMetadata`'s rules, so the invoice names what provisioning buys. */
  domainName?: string;
  /** Absent when the intent carries no valid year count. */
  domainYears?: number;
}

/** Splits a comma-joined metadata list, dropping the empty-string case. */
function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Reconstructs an order from a PaymentIntent.
 *
 * Returns null when the intent carries no plan — that intent was created by an
 * older build (before names were recorded) or by something other than the
 * studio checkout, and provisioning it would produce a broken wedding.
 */
export function parseOrderMetadata(
  intent: Stripe.PaymentIntent,
): ParsedOrder | null {
  const meta = (intent.metadata ?? {}) as Record<string, string>;

  const plan = meta.plan?.trim();
  if (!plan) return null;

  const email = (meta.email || intent.receipt_email || "").trim();
  if (!email) return null;

  return {
    plan,
    modules: splitList(meta.modules),
    languages: splitList(meta.languages),
    extras: splitList(meta.extras),
    email,
    // Mirrors the defaults `createWedding()` already applies, so a pre-existing
    // intent without these keys still provisions instead of failing. The theme
    // fallback is the first entry of `studio/themes.ts`, not an invented id:
    // an unknown theme_id would render an invitation with no template.
    themeId: meta.theme_id?.trim() || "ciao-amore",
    animationId: meta.animation_id?.trim() || "envelope-classic",
    adultsOnly: meta.adults_only === "1",
    firstName: meta.first_name?.trim() || "",
    lastName: meta.last_name?.trim() || "",
    partnerName: meta.partner_name?.trim() || "",
    weddingDate: meta.wedding_date?.trim() || undefined,
    venue: meta.venue?.trim() || undefined,
    locale: meta.locale?.trim() || undefined,
    domainName: domainFromIntentMetadata(meta).name,
    domainYears: parseDomainYears(meta.domain_years) ?? undefined,
  };
}

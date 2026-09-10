import type Stripe from "stripe";

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
  locale?: string;
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
    locale: input.locale,
  };

  for (const [key, value] of Object.entries(optional)) {
    const trimmed = value?.trim();
    if (trimmed) entries[key] = clamp(trimmed);
  }

  if (input.adultsOnly) entries.adults_only = "1";

  return entries;
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
  locale?: string;
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
    locale: meta.locale?.trim() || undefined,
  };
}

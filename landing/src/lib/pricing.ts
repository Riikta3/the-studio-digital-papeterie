/**
 * Single source of truth for order pricing.
 *
 * Imported by both the client store (selectTotalPrice) and the server-side
 * payment intent route, so the amount shown to the customer and the amount
 * actually charged can never drift apart.
 */

/**
 * Plan ids match the `Pricing.plans` entries on the homepage, so the card a
 * couple clicks there and the plan the studio charges for are the same thing.
 * They used to be two disconnected vocabularies — "experience"/"premium" at
 * 175/575 here against "signature"/"sur-mesure"/"prestige" at 199/299/499 in
 * the messages — which meant the marketing price and the billed price simply
 * disagreed.
 */
export const PLAN_PRICES: Record<string, number> = {
  signature: 199,
  "sur-mesure": 299,
  prestige: 499,
};

/**
 * Plans whose module allowance is capped; every other plan is unlimited.
 * Signature is the entry tier and includes FREE_MODULES_LIMIT modules, then
 * bills EXTRA_MODULE_PRICE for each additional one.
 */
const METERED_MODULE_PLANS = new Set(["signature"]);

/** Whether this plan bills per extra module beyond the included allowance. */
export function hasMeteredModules(plan: string | null | undefined): boolean {
  return METERED_MODULE_PLANS.has(plan ?? "");
}

export const EXTRA_PRICES: Record<string, number> = {
  "custom-music": 10,
  "custom-illustration": 45,
  "animated-video": 55,
  "custom-domain": 65,
};

export const LANGUAGE_PRICE = 15;

/** Signature includes 4 modules; each extra one costs 5€. */
export const FREE_MODULES_LIMIT = 4;
export const EXTRA_MODULE_PRICE = 5;

export interface OrderItems {
  plan?: string | null;
  modules?: string[];
  languages?: string[];
  extras?: string[];
}

/** Returns the order total in euros, or null when the plan is unknown. */
export function computeOrderTotal(items: OrderItems): number | null {
  const basePrice = PLAN_PRICES[items.plan ?? ""];
  if (basePrice === undefined) return null;

  const modules = items.modules ?? [];
  const moduleSurcharge = hasMeteredModules(items.plan)
    ? Math.max(0, modules.length - FREE_MODULES_LIMIT) * EXTRA_MODULE_PRICE
    : 0;

  // The first entry is the couple's default language, which is included in
  // every plan; only the ones after it are the paid extras. `sites.languages`
  // is written default-first at checkout, and it used to hold ONLY the extras
  // — so the couple's own language was never recorded anywhere. Recording it
  // made this line bill for it, charging 15 € for French on a French wedding.
  const languagesTotal =
    Math.max(0, (items.languages ?? []).length - 1) * LANGUAGE_PRICE;

  const extrasTotal = (items.extras ?? []).reduce(
    (sum, extra) => sum + (EXTRA_PRICES[extra] ?? 0),
    0,
  );

  return basePrice + moduleSurcharge + languagesTotal + extrasTotal;
}

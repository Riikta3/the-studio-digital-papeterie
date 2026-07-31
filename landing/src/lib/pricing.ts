/**
 * Single source of truth for order pricing.
 *
 * Imported by both the client store (selectTotalPrice) and the server-side
 * payment intent route, so the amount shown to the customer and the amount
 * actually charged can never drift apart.
 */

export const PLAN_PRICES: Record<string, number> = {
  experience: 175,
  premium: 575,
};

export const EXTRA_PRICES: Record<string, number> = {
  "custom-music": 10,
  "custom-illustration": 45,
  "animated-video": 55,
  "custom-domain": 65,
};

export const LANGUAGE_PRICE = 15;

/** The Essential plan includes 4 modules; each extra one costs 5€. */
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
  const moduleSurcharge =
    items.plan === "experience"
      ? Math.max(0, modules.length - FREE_MODULES_LIMIT) * EXTRA_MODULE_PRICE
      : 0;

  const languagesTotal = (items.languages ?? []).length * LANGUAGE_PRICE;

  const extrasTotal = (items.extras ?? []).reduce(
    (sum, extra) => sum + (EXTRA_PRICES[extra] ?? 0),
    0,
  );

  return basePrice + moduleSurcharge + languagesTotal + extrasTotal;
}

/**
 * Single source of truth for pricing — the checkout's order and the modules a
 * couple adds after it (docs/superpowers/specs/2026-09-28-dashboard-module-purchase-design.md, D2).
 *
 * Imported by the landing's store and payment route, and by the dashboard, so
 * the amount shown to the customer and the amount actually charged can never
 * drift apart.
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

/**
 * Flat-priced extras. "custom-domain" is deliberately not here: its price
 * depends on how many years the domain must be registered for, so it is
 * billed by `domainPrice` below. Anything that walks this table to price or
 * describe an order (the invoice lines) must handle the domain itself.
 */
export const EXTRA_PRICES: Record<string, number> = {
  "custom-music": 10,
  "custom-illustration": 45,
  "animated-video": 55,
};

export const LANGUAGE_PRICE = 15;

/** Signature includes 4 modules; each extra one costs 5€. */
export const FREE_MODULES_LIMIT = 4;
export const EXTRA_MODULE_PRICE = 5;

/**
 * Modules every plan includes whatever the allowance: the RSVP is a service of
 * each offer, not one of the modules the couple picks. Provisioning adds it to
 * every order, and it never counts towards FREE_MODULES_LIMIT nor is billed.
 */
export const ALWAYS_INCLUDED_MODULES: readonly string[] = ["rsvp"];

/** Whether this module is part of every plan rather than one the couple picks. */
export function isAlwaysIncludedModule(id: string): boolean {
  return ALWAYS_INCLUDED_MODULES.includes(id);
}

/** How many of these modules count towards the allowance (and the 5 € each beyond it). */
export function countedModules(modules: readonly string[]): number {
  return new Set(modules.filter((id) => !isAlwaysIncludedModule(id))).size;
}

/*
 * Custom domain (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D1).
 *
 * The domain must stay up until a few months after the wedding, so a couple
 * marrying in two years pays for two years of registration. The years are
 * computed by the server when the PaymentIntent is created or repriced, then
 * frozen in its metadata: every later reader takes them from there and never
 * recomputes them from a later "today".
 */
export const DOMAIN_BASE_PRICE = 65; // €, first year
export const DOMAIN_EXTRA_YEAR_PRICE = 20; // €, each year after
export const DOMAIN_COVER_MONTHS = 3; // months covered after the wedding
/**
 * The registry's own limit, never a business one: a lower cap would let the
 * domain of a wedding far ahead expire before the day.
 */
export const DOMAIN_MAX_YEARS = 10;
/**
 * What the studio accepts to pay Vercel per year, in USD. Above it (a premium
 * or an unusually priced name) the domain is not offered, because 65 € would
 * no longer cover it.
 */
export const DOMAIN_MAX_USD_PER_YEAR = 15;

/** A calendar date, with a 1-12 month, free of any timezone. */
interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days in a 1-12 month: day 0 of the next month is the last of this one. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Whether this day exists in this 1-12 month of this year: 31 April, 30
 * February and 29 February outside a leap year do not.
 *
 * Exported for the studio, whose day field accepts 1-31 whatever the month.
 * A date like 31 April used to travel all the way to the PaymentIntent, where
 * `domainYearsFor` (rightly) refused it and priced the domain as one year — so
 * a couple marrying in three years was charged, and registered, for one.
 */
export function isRealDate(year: number, month: number, day: number): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  );
}

/**
 * Reads a `YYYY-MM-DD` string by hand. `new Date("2027-07-02")` would work
 * for this exact shape, but any other shape is parsed in the server's local
 * timezone — and a date that does not exist (30 February) silently rolls into
 * the next month instead of being refused.
 */
function parseDateOnly(value: string | null | undefined): CalendarDate | null {
  const match = DATE_ONLY.exec(value ?? "");
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (!isRealDate(year, month, day)) return null;
  return { year, month, day };
}

/**
 * Adds calendar months, clamping the day to the target month's last: 30
 * November + 3 months is 28 (or 29) February, never 2 March. Years are added
 * as 12 months, so 29 February + 1 year is 28 February — the day a domain
 * registered on a 29 February actually expires.
 */
function addMonths(date: CalendarDate, months: number): CalendarDate {
  const index = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/** Comparable day number: only ever compared, never turned back into a Date. */
const dayValue = (date: CalendarDate) => Date.UTC(date.year, date.month - 1, date.day);

/**
 * How many years of registration a domain bought `today` needs so it does not
 * expire before DOMAIN_COVER_MONTHS after the wedding: the smallest n ≥ 1
 * with `today + n years ≥ wedding + 3 months`, capped at DOMAIN_MAX_YEARS.
 *
 * A missing, invalid or past date gives 1. All arithmetic is on UTC calendar
 * dates, so the server's timezone cannot move a boundary: a wedding exactly
 * 9 months away is 1 year, a day more is 2.
 */
export function domainYearsFor(weddingDate: string | null | undefined, today: Date): number {
  const wedding = parseDateOnly(weddingDate);
  if (!wedding || !Number.isFinite(today.getTime())) return 1;

  const start: CalendarDate = {
    year: today.getUTCFullYear(),
    month: today.getUTCMonth() + 1,
    day: today.getUTCDate(),
  };
  const coverUntil = dayValue(addMonths(wedding, DOMAIN_COVER_MONTHS));

  for (let years = 1; years < DOMAIN_MAX_YEARS; years += 1) {
    if (dayValue(addMonths(start, years * 12)) >= coverUntil) return years;
  }
  return DOMAIN_MAX_YEARS;
}

/**
 * A number of registration years the registry sells — a whole number from 1
 * to DOMAIN_MAX_YEARS — read from a number or from its decimal string (Stripe
 * metadata holds strings). Null for anything else: 0, 11, 2.5, NaN, Infinity,
 * "abc", " 2", undefined.
 *
 * The one gate every reader of a stored or sent year count goes through, so
 * "how many years" never has two answers: a value that is not exactly a
 * number of years the registry sells is refused, never rounded into one.
 */
export function parseDomainYears(value: unknown): number | null {
  let years: number;
  if (typeof value === "number") years = value;
  else if (typeof value === "string" && /^\d+$/.test(value)) years = Number(value);
  else return null;
  return Number.isInteger(years) && years >= 1 && years <= DOMAIN_MAX_YEARS ? years : null;
}

/**
 * The domain's price in euros for a number of years: 65 € the first, 20 €
 * each one after.
 *
 * Throws a RangeError unless `years` is a whole number from 1 to
 * DOMAIN_MAX_YEARS. It used to clamp instead, so 2.7 years priced as 2 and 12
 * as 10: the amount charged then described a registration nobody would buy.
 * A caller holding an untrusted value passes it through `parseDomainYears`
 * first and decides what a refusal means for it.
 */
export function domainPrice(years: number): number {
  // A number, not the metadata's string: parsing is the caller's decision.
  if (typeof years !== "number" || parseDomainYears(years) === null) {
    throw new RangeError(`domainPrice: ${String(years)} is not a number of years from 1 to ${DOMAIN_MAX_YEARS}`);
  }
  return DOMAIN_BASE_PRICE + (years - 1) * DOMAIN_EXTRA_YEAR_PRICE;
}

export interface OrderItems {
  plan?: string | null;
  modules?: string[];
  languages?: string[];
  extras?: string[];
  /**
   * Years of registration for the custom domain, from `domainYearsFor`. Only
   * read when `extras` contains "custom-domain"; 1 when not known yet, or
   * when it is not a number of years the registry sells.
   */
  domainYears?: number;
}

/**
 * Returns the order total in euros, or null when the plan is unknown.
 *
 * The custom domain is priced by `domainPrice` for
 * `parseDomainYears(items.domainYears) ?? 1` rather than from EXTRA_PRICES.
 * Whoever charges the order must pass the same years it writes to the
 * PaymentIntent, or the amount charged and the years bought would disagree.
 * A value that is not a number of years (an old basket, a hand-made request)
 * prices one year rather than throwing out the whole order: the server
 * computes the real years itself before it charges.
 */
export function computeOrderTotal(items: OrderItems): number | null {
  const basePrice = PLAN_PRICES[items.plan ?? ""];
  if (basePrice === undefined) return null;

  const modules = items.modules ?? [];
  const moduleSurcharge = hasMeteredModules(items.plan)
    ? Math.max(0, countedModules(modules) - FREE_MODULES_LIMIT) * EXTRA_MODULE_PRICE
    : 0;

  // The first entry is the couple's default language, which is included in
  // every plan; only the ones after it are the paid extras. `sites.languages`
  // is written default-first at checkout, and it used to hold ONLY the extras
  // — so the couple's own language was never recorded anywhere. Recording it
  // made this line bill for it, charging 15 € for French on a French wedding.
  const languagesTotal =
    Math.max(0, (items.languages ?? []).length - 1) * LANGUAGE_PRICE;

  const extras = items.extras ?? [];
  const extrasTotal = extras.reduce(
    (sum, extra) => sum + (EXTRA_PRICES[extra] ?? 0),
    0,
  );
  const domainTotal = extras.includes("custom-domain")
    ? domainPrice(parseDomainYears(items.domainYears) ?? 1)
    : 0;

  return basePrice + moduleSurcharge + languagesTotal + extrasTotal + domainTotal;
}

/**
 * Plan ids still on sites sold before the plans were renamed. "premium" (575 €)
 * was sold as « Tout inclus (Blocs illimités) », "experience" (175 €) with
 * « 4 blocs d'informations inclus » — `landing-deprecated/.../pricing.tsx`.
 */
const LEGACY_PLANS: Record<string, string> = {
  premium: "prestige",
  experience: "signature",
};

/**
 * Whether modules added after the sale are billed beyond the plan's allowance.
 * An id that is no plan at all (the column defaults to 'essential') is: giving
 * every module away is the costlier mistake.
 */
export function hasMeteredAddOns(planId: string | null | undefined): boolean {
  const plan = LEGACY_PLANS[planId ?? ""] ?? planId ?? "";
  return plan in PLAN_PRICES ? hasMeteredModules(plan) : true;
}

export interface AddOnQuote {
  /** Modules the plan's allowance still covers — the first ones added. */
  included: number;
  billable: number;
  totalEuros: number;
}

/**
 * Prices `addedCount` modules for a wedding that already owns `ownedCount`:
 * exactly the difference between the checkout totals with and without them.
 */
export function addOnQuote(
  planId: string | null | undefined,
  ownedCount: number,
  addedCount: number,
): AddOnQuote {
  // Callers pass list lengths; anything else is truncated, never billed up.
  const added = Math.max(0, Math.floor(addedCount));
  if (!hasMeteredAddOns(planId)) return { included: added, billable: 0, totalEuros: 0 };

  const left = Math.max(0, FREE_MODULES_LIMIT - Math.max(0, Math.floor(ownedCount)));
  const included = Math.min(added, left);
  const billable = added - included;
  return { included, billable, totalEuros: billable * EXTRA_MODULE_PRICE };
}

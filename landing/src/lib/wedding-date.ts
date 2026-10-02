/**
 * The couple's wedding date, read back from the studio's order store.
 *
 * Moved out of the checkout page so the options step can compute the custom
 * domain's years from the same date the checkout sends to Stripe
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3). Two pages
 * deriving the date in two ways would price one number of years and charge
 * another.
 */

import { isRealDate } from "@shared/lib/pricing";

/**
 * French month names, kept only to read back orders stored before the fix
 * below — see `monthIndexFrom`.
 */
export const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/**
 * Turns the stored month label into a 1-12 index.
 *
 * The start page writes `weddingInfo.month` as the *translated* label it
 * rendered (`t.raw("months")`, studio/start/page.tsx:86), so it holds
 * "January" for an English couple and "1月" for a Japanese one. This function
 * used to match that against `MONTHS_FR` alone, which returns -1 for all eight
 * non-French locales — `weddingDate` then fell to `undefined` and the couple's
 * wedding date was silently dropped at checkout, with no error shown and
 * nothing in the Stripe metadata for the webhook to recover from.
 *
 * The localised list is therefore the one that matters; MONTHS_FR stays as a
 * fallback because the order store is persisted, so a basket started before
 * this deploy still carries whatever label it was written with.
 */
export function monthIndexFrom(month: string, localisedMonths: string[]): number {
  const needle = month.trim().toLowerCase();
  if (!needle) return 0;

  const inLocale = localisedMonths.findIndex(
    (m) => m.trim().toLowerCase() === needle,
  );
  if (inLocale >= 0) return inLocale + 1;

  const inFrench = MONTHS_FR.findIndex(
    (m) => m.trim().toLowerCase() === needle,
  );
  return inFrench >= 0 ? inFrench + 1 : 0;
}

/**
 * The wedding date as `YYYY-MM-DD`, or undefined when a part is missing, the
 * month label is not recognised, or the day does not exist in that month.
 *
 * The string is assembled, never parsed through `Date`, so no timezone can
 * shift it by a day. The webhook provisions from this exact value in the
 * intent's metadata.
 *
 * An impossible day (31 April, 29 February 2027) gives undefined rather than
 * a string: the start page's day field accepts 1-31 whatever the month, and
 * `domainYearsFor` on the server refuses such a date and prices the domain as
 * one year. Sending it would have charged a couple marrying in three years
 * for one year of registration — a domain that lapses before the wedding.
 * Day and year must also be whole numbers, the year four digits, as the
 * start page requires.
 */
export function weddingDateFrom(
  info: { day: string; month: string; year: string },
  /** `StudioStart.months` in the locale the couple is ordering in. */
  localisedMonths: string[],
): string | undefined {
  const monthIndex = monthIndexFrom(info.month, localisedMonths);
  const day = String(info.day ?? "").trim();
  const year = String(info.year ?? "").trim();
  if (!/^\d{1,2}$/.test(day) || !/^\d{4}$/.test(year) || monthIndex === 0) return undefined;
  if (!isRealDate(Number(year), monthIndex, Number(day))) return undefined;
  return `${year}-${String(monthIndex).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The value itself when it is a real `YYYY-MM-DD` date, otherwise undefined.
 *
 * For provisioning, which takes the date from the browser or from the
 * intent's metadata and must never fail a paid order on it: `weddings.wedding_date`
 * is a `date` column, so "2027-04-31" would make the insert fail after the
 * money was taken. A date that is not real is treated as no date at all, the
 * same reading `domainYearsFor` gives it.
 */
export function checkedWeddingDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = DATE_ONLY.exec(value);
  if (!match) return undefined;
  return isRealDate(Number(match[1]), Number(match[2]), Number(match[3])) ? value : undefined;
}

/**
 * Date helpers shared by every theme.
 *
 * Themes print dates constantly, so the rules live here rather than being
 * rediscovered — or forgotten — in each one.
 *
 * ## Locale
 *
 * These were `fr-FR` only, hard-coded in three places, so an invitation in any
 * of the app's nine locales still printed "samedi 12 juin". They take a locale
 * now and default to French, which is what every current caller wants and
 * keeps the change from silently altering existing pages.
 *
 * The French ordinal rule ("1er juin", never "1 juin") is applied only when
 * the locale is actually French. It used to run unconditionally, which would
 * have turned an English "1 June" into "1er June" the moment a theme was
 * translated.
 */

/** The locale a theme formats in. */
export type FormatOptions = {
  timeZone?: string;
  /** BCP 47 tag. Defaults to French, as every theme is French-first today. */
  locale?: string;
};

const DEFAULT_LOCALE = "fr-FR";

/** Parse an ISO date or datetime. Returns `null` when it is unusable. */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // A bare `YYYY-MM-DD` is parsed as UTC, which shifts the day backwards for
  // anyone west of Greenwich. Pin it to local midnight instead.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** French writes the first of the month as an ordinal; no other locale here does. */
function isFrench(locale: string): boolean {
  return locale.toLowerCase().startsWith("fr");
}

/**
 * "1er juin 2026", "5 janvier 2027" — and "1 June 2026" under `en`.
 *
 * Named `formatFrenchDate` for the callers that predate the locale parameter;
 * it is the shared long-date formatter and is French only by default.
 */
export function formatFrenchDate(
  value: string | null | undefined,
  options?: FormatOptions,
): string | null {
  const date = toDate(value);
  if (!date) return null;

  const locale = options?.locale ?? DEFAULT_LOCALE;
  const formatted = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: options?.timeZone,
  }).format(date);

  return isFrench(locale) ? formatted.replace(/^1 /, "1er ") : formatted;
}

/**
 * "mardi 5 janvier 2027" — the weekday form, for day headers.
 * Capitalisation is left to CSS so themes can choose.
 */
export function formatFrenchWeekday(
  value: string | null | undefined,
  options?: FormatOptions,
): string | null {
  const date = toDate(value);
  if (!date) return null;

  const locale = options?.locale ?? DEFAULT_LOCALE;
  const formatted = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: options?.timeZone,
  }).format(date);

  return isFrench(locale) ? formatted.replace(/ 1 /, " 1er ") : formatted;
}

/**
 * A count and its noun, pluralised for the locale.
 *
 * The themes each grew their own `count > 1 ? "s" : ""`, which is the French
 * rule and wrong almost everywhere else: English pluralises from two but says
 * "0 guests", and Arabic, Japanese and Chinese do not work this way at all.
 * `Intl.PluralRules` knows each locale's categories, so a caller supplies the
 * forms it has and gets the right one.
 *
 * @example plural(2, { one: "place", other: "places" })      // "places"
 * @example plural(0, { one: "guest", other: "guests" }, "en") // "guests"
 */
export function plural(
  count: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>>,
  locale: string = DEFAULT_LOCALE,
): string {
  const category = new Intl.PluralRules(locale).select(count);
  return forms[category] ?? forms.other ?? "";
}

/**
 * The two date shapes this theme prints that `date-range.ts` does not have: a
 * day heading without a year ("samedi 19 juin") and a range with weekdays
 * ("samedi 19 – dimanche 20 juin 2027"). Both read the calendar day as written
 * (pinned to UTC), so a server and a browser in different timezones agree.
 */

function utcDay(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const isFrench = (locale: string) => locale.toLowerCase().startsWith("fr");

/**
 * Thin (U+2009) and narrow no-break (U+202F) spaces.
 *
 * Intl joins a range with a delimiter whose spaces depend on the engine's ICU
 * (Node 24 writes thin ones around the dash, a browser may write plain ones). A
 * range is printed by components that render on the server and again in the
 * browser, and two spellings of one date is a hydration mismatch — so they are
 * all written as a plain space, before the French "1er" is looked for.
 */
const THIN_SPACES = /[  ]/g;

/** "samedi 19 juin" — the weekday, the day and the month, with no year. */
export function dayHeading(iso: string | null | undefined, locale: string): string | null {
  const date = utcDay(iso);
  if (!date) return null;
  const text = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return isFrench(locale) ? text.replace(/ 1 /, " 1er ") : text;
}

/**
 * "samedi 19 – dimanche 20 juin 2027" for two days, "samedi 19 juin 2027" for
 * one. A reversed range is put in order.
 */
export function weekdayRange(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: string,
): string | null {
  const from = utcDay(start);
  if (!from) return null;
  const to = utcDay(end);

  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const text = (
    !to || to.getTime() === from.getTime()
      ? formatter.format(from)
      : from <= to
        ? formatter.formatRange(from, to)
        : formatter.formatRange(to, from)
  ).replace(THIN_SPACES, " ");

  return isFrench(locale) ? text.replace(/ 1 /g, " 1er ") : text;
}

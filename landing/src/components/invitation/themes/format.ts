/**
 * Date helpers shared by every theme.
 *
 * Themes print dates constantly and all of them are French-first, so the
 * ordinal rule ("1er juin", never "1 juin") lives here rather than being
 * rediscovered — or forgotten — in each one.
 */

const FR_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Parse an ISO date or datetime. Returns `null` when it is unusable. */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  // A bare `YYYY-MM-DD` is parsed as UTC, which shifts the day backwards for
  // anyone west of Greenwich. Pin it to local midnight instead.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * "1er juin 2026", "5 janvier 2027".
 *
 * French writes the first of the month as an ordinal and every other day as a
 * cardinal; `Intl` does not do this, so it is applied here.
 */
export function formatFrenchDate(
  value: string | null | undefined,
  options?: { timeZone?: string },
): string | null {
  const date = toDate(value);
  if (!date) return null;

  const formatter = options?.timeZone
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: options.timeZone,
      })
    : FR_DATE;

  const formatted = formatter.format(date);
  return formatted.replace(/^1 /, "1er ");
}

/**
 * "mardi 5 janvier 2027" — the weekday form, for day headers.
 * Capitalisation is left to CSS so themes can choose.
 */
export function formatFrenchWeekday(
  value: string | null | undefined,
  options?: { timeZone?: string },
): string | null {
  const date = toDate(value);
  if (!date) return null;

  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: options?.timeZone,
  }).format(date);

  return formatted.replace(/ 1 /, " 1er ");
}

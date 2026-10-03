/**
 * "ven. 1er avr." — a day written short, in the page's language: the badge on
 * the cards of the wedding's other events.
 *
 * Takes an ISO day (a time after it is ignored) and returns null for anything
 * it cannot read, so a card without a date simply has no badge. Pinned to UTC
 * midnight so no time zone can move the day, on the server or in the browser.
 */
export function shortDay(iso: string | null | undefined, locale: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;

  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  const text = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);

  // French writes the first of the month as an ordinal; no other locale here does.
  return locale.toLowerCase().startsWith("fr") ? text.replace(/(^|\s)1(\s)/, "$11er$2") : text;
}

/**
 * "18 juin" — a day and its month, no year, in the page's language: the dates
 * the RSVP lists under its title.
 */
export function dayMonth(iso: string | null | undefined, locale: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;

  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;

  const text = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
  return locale.toLowerCase().startsWith("fr") ? text.replace(/^1 /, "1er ") : text;
}

/** Narrow and thin spaces Intl puts around a range's dash, which differ between engines (see `date-range.ts`). */
const THIN_SPACES = /[  ]/g;

/**
 * "2–4 avr." — the days of the celebration, short and without the year: the
 * stamp beside the country and the city above the hotels, which has the room of
 * one word. One day prints alone; a reversed range is put in order.
 */
export function shortSpan(start: string | null | undefined, end: string | null | undefined, locale: string): string | null {
  const read = (iso: string | null | undefined) => {
    if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
    const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const from = read(start);
  if (!from) return null;
  const to = read(end) ?? from;

  const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const [first, last] = from <= to ? [from, to] : [to, from];
  const text = (first.getTime() === last.getTime() ? format.format(first) : format.formatRange(first, last)).replace(
    THIN_SPACES,
    " ",
  );

  return locale.toLowerCase().startsWith("fr") ? text.replace(/(^|[–-]\s?)1(?!\d)/g, "$11er") : text;
}

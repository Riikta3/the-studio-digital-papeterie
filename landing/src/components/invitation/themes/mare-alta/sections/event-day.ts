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

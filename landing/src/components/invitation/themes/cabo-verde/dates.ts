/** "30 avril" — the day and month as written in an ISO date, in the page's language. */
export function dayMonth(iso: string | null | undefined, locale: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const text = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
  return locale.toLowerCase().startsWith("fr") ? text.replace(/^1 /, "1er ") : text;
}

/**
 * "30 APR 2027" — the day, short month and year as written in an ISO date, in the
 * page's language and in capitals (the boarding pass of the travel notebook sets
 * it that way). Computed in UTC from the written day, like `dayMonth`, so the
 * server and the browser print the same thing.
 */
export function shortDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const text = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
  return (locale.toLowerCase().startsWith("fr") ? text.replace(/^1 /, "1er ") : text).toLocaleUpperCase(locale);
}

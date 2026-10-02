/** "30 avril" — the day and month as written in an ISO date, in the page's language. */
export function dayMonth(iso: string | null | undefined, locale: string): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null;
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const text = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
  return locale.toLowerCase().startsWith("fr") ? text.replace(/^1 /, "1er ") : text;
}

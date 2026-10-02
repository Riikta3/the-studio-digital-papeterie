import { formatFrenchDate, formatFrenchWeekday } from "./format";
import type { InvitationData } from "./types";

/**
 * Dates a theme prints for a wedding that may span several days.
 *
 * Every function takes an ISO day (`YYYY-MM-DD`, a time after it is ignored)
 * and the page's locale, and returns null for anything it cannot read — a
 * theme then omits the line, instead of printing "Invalid Date".
 */

type DateOptions = { locale?: string };

const DEFAULT_LOCALE = "fr-FR";

/** A bare day pinned to UTC midnight, so no timezone can shift it. */
function utcDay(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isFrench(locale: string): boolean {
  return locale.toLowerCase().startsWith("fr");
}

/**
 * Thin (U+2009) and narrow no-break (U+202F) spaces.
 *
 * Intl joins a range with a delimiter whose spaces depend on the engine's ICU:
 * Node 24 (ICU 78) writes thin spaces around the dash, Chrome 154 plain ones. A
 * range is printed by components that render on the server and again in the
 * browser, and two spellings of one date is a hydration mismatch.
 */
const THIN_SPACES = /[  ]/g;

/**
 * "19–20 juin 2027" for two days, "19 juin 2027" for one.
 *
 * Intl writes the range in the locale's own manner ("June 19 – 20, 2027",
 * "19.–20. Juni 2027"). French also needs its "1er", which Intl does not know.
 * A reversed range is put in order.
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  options: DateOptions = {},
): string | null {
  const from = utcDay(start);
  if (!from) return null;

  const locale = options.locale ?? DEFAULT_LOCALE;
  const to = utcDay(end);

  if (!to || to.getTime() === from.getTime()) {
    return formatFrenchDate(start!.slice(0, 10), { locale });
  }

  const [first, last] = from <= to ? [from, to] : [to, from];
  const text = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
    .formatRange(first, last)
    .replace(THIN_SPACES, " ");

  return isFrench(locale) ? text.replace(/(^|[–-]\s?)1(?!\d)/g, "$11er") : text;
}

/**
 * "30 · 04 · 2027" — the dotted label several designs print under the names.
 * Day, month and year come in the locale's order ("04 · 30 · 2027" in US
 * English, "2027 · 04 · 30" in Japanese).
 */
export function formatDottedDate(
  value: string | null | undefined,
  options: DateOptions = {},
): string | null {
  const date = utcDay(value);
  if (!date) return null;

  return new Intl.DateTimeFormat(options.locale ?? DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
    .formatToParts(date)
    .filter((part) => part.type === "day" || part.type === "month" || part.type === "year")
    .map((part) => part.value)
    .join(" · ");
}

/**
 * The two date lines a hero prints, in the page's language.
 *
 * The mapper hands a theme `copy.dateLabel` ("19 · 06 · 2027") and
 * `copy.dateSpelled` ("samedi 19 juin 2027") already formatted — in French,
 * whatever the page's locale — and a couple can overwrite either in the editor.
 * Printing them as they come leaves a translated page with a French date;
 * always re-deriving would ignore a couple's own wording. So a value that is
 * exactly what the mapper would have derived is derived again in `locale`, and
 * anything else is the couple's and is kept.
 *
 * Both are computed from the calendar day written in `startsAt` rather than
 * from the instant: an instant formats differently on a server in UTC and in a
 * browser in Paris for a wedding that starts just after midnight, and the two
 * disagreeing is a hydration mismatch.
 */
export function heroDates(
  data: Pick<InvitationData, "event" | "copy">,
  locale: string,
): { dotted: string | null; spelled: string | null } {
  const day = data.event.startsAt.slice(0, 10);

  const derivedDotted = formatDottedDate(day, { locale: "fr-FR" });
  const derivedSpelled = formatFrenchWeekday(day, { locale: "fr-FR" });
  const writtenDotted = data.copy?.dateLabel?.trim();
  const writtenSpelled = data.copy?.dateSpelled?.trim();

  return {
    dotted:
      writtenDotted && writtenDotted !== derivedDotted
        ? writtenDotted
        : formatDottedDate(day, { locale }),
    spelled:
      writtenSpelled && writtenSpelled !== derivedSpelled
        ? writtenSpelled
        : formatFrenchWeekday(day, { locale }),
  };
}

/**
 * First and last day of the wedding: the start of the countdown and every
 * dated event, whichever they are. Null when none of them is readable.
 */
export function weddingSpan(
  data: Pick<InvitationData, "event" | "events">,
): { start: string; end: string } | null {
  const days = [data.event.startsAt, ...(data.events ?? []).map((event) => event.date)]
    .map((value) => (value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null))
    .filter((day): day is string => day !== null)
    .sort();

  if (days.length === 0) return null;
  return { start: days[0]!, end: days[days.length - 1]! };
}

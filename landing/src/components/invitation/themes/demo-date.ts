/**
 * Rolling dates for demo content.
 *
 * A demo with a hard-coded wedding date goes stale on its own: once the date
 * passes, every showcase invitation shows a countdown stuck at zero. Demo
 * datasets call these helpers instead, so the wedding is always six months out
 * and the RSVP deadline always ahead of it.
 *
 * Every date lands on a Saturday, as a wedding does: a demo that reads
 * "mardi 2 mars" looks wrong to a couple, and the designers' mock-ups all
 * marry on a Saturday with a brunch on the Sunday. The same rule applies to
 * every helper, so a theme's `demoStartsAt(n)` and `demoDate(n)` stay the
 * same day.
 *
 * ## Why the day is pinned
 *
 * These run on the server (rendering the page) and again in the browser
 * (hydrating it). If they returned a value derived from the exact current time,
 * the two would disagree by milliseconds and React would report a hydration
 * mismatch. Everything below is therefore computed from midnight UTC of the
 * current day — stable for the whole day, on both sides.
 *
 * The countdown itself still ticks per second: it compares this fixed target
 * against a live `Date.now()` read only in the browser.
 */

/** Midnight UTC today — the anchor every helper below is derived from. */
function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addMonths(date: Date, months: number): Date {
  const out = new Date(date);
  // `setUTCMonth` rolls over on short months (31 Aug + 6 → 31 Feb → 3 Mar).
  // Clamping to the last valid day keeps the date inside the intended month.
  const targetMonth = out.getUTCMonth() + months;
  const day = out.getUTCDate();
  out.setUTCDate(1);
  out.setUTCMonth(targetMonth);
  const lastDay = new Date(Date.UTC(out.getUTCFullYear(), out.getUTCMonth() + 1, 0)).getUTCDate();
  out.setUTCDate(Math.min(day, lastDay));
  return out;
}

/** The date itself when it is a Saturday, otherwise the next one. */
function nextSaturday(date: Date): Date {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + ((6 - out.getUTCDay() + 7) % 7));
  return out;
}

/** The Saturday `monthsAhead` months from today — the day every helper below names. */
function demoDay(monthsAhead: number): Date {
  return nextSaturday(addMonths(todayUtc(), monthsAhead));
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * An ISO timestamp on the Saturday `monthsAhead` months from today, at the
 * given wall-clock time and UTC offset.
 *
 * The offset is the theme's own — a wedding in Ravello is `+01:00`, one on the
 * Riviera in June is `+02:00` — so it is passed in rather than guessed.
 *
 * @example demoStartsAt(6, "17:00", "+01:00") // "2027-03-06T17:00:00+01:00"
 */
export function demoStartsAt(monthsAhead = 6, time = "17:00", offset = "+02:00"): string {
  const date = demoDay(monthsAhead);
  const [hh = "17", mm = "00"] = time.split(":");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(Number(hh))}:${pad(Number(mm))}:00${offset}`
  );
}

/** A plain `YYYY-MM-DD` date: the Saturday `monthsAhead` months from today. */
export function demoDate(monthsAhead: number): string {
  const date = demoDay(monthsAhead);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * The day after `demoStartsAt(monthsAhead)` — for themes that run a second day
 * (brunch, pool party).
 */
export function demoDayAfter(monthsAhead = 6): string {
  const date = demoDay(monthsAhead);
  date.setUTCDate(date.getUTCDate() + 1);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/**
 * Labels a demo date the way a couple would write it: "Le 2 mars 2027",
 * "05 · 01 · 2027", "Mardi cinq janvier".
 *
 * Kept here so a dataset never has to restate a date it already computed —
 * a literal label would drift out of step with the rolling date.
 */
export const demoLabel = {
  /** "05 · 01 · 2027" */
  dotted(iso: string): string {
    const d = new Date(iso);
    return `${pad(d.getUTCDate())} · ${pad(d.getUTCMonth() + 1)} · ${d.getUTCFullYear()}`;
  },

  /** "2 mars 2027" */
  long(iso: string): string {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(new Date(iso))
      .replace(/^1 /, "1er ");
  },

  /** "mardi 2 mars 2027" */
  weekday(iso: string): string {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(new Date(iso))
      .replace(/ 1 /, " 1er ");
  },
};

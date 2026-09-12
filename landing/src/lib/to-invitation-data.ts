import type { InvitationPageData } from "@/actions/invitation-page-actions";
import type {
  InvitationData,
  ModuleId,
  ScheduleEntry,
} from "@/components/invitation/themes/types";
import { MODULE_IDS } from "@/components/invitation/themes/types";
import { formatFrenchWeekday } from "@/components/invitation/themes/format";

/**
 * Turns a couple's database rows into the shape every theme reads.
 *
 * This is the join between the two halves of the product. `InvitationPageData`
 * is shaped by the tables — flat, with column names — and `InvitationData` is
 * the contract a theme renders. Until this existed the only values of the
 * contract type were the three `demo-data.ts` files, so a real wedding could
 * not be rendered by a real theme, and `sites.theme_id` was read and thrown
 * away.
 *
 * ## The rule this file exists to keep
 *
 * Themes render; they do not fetch, derive or invent. Everything a theme needs
 * is assembled here, once, so a change to how a wedding's data is interpreted
 * happens in one place and every theme follows it. A theme that reaches for
 * something this function does not provide is a theme that will disagree with
 * the others.
 *
 * ## What it does not do
 *
 * It fills no gaps. Content a couple has not written arrives absent, and the
 * theme hides that section — an invitation must never assert a fact nobody
 * typed. Starting content is a separate concern with a separate owner:
 * `themes/defaults.ts` seeds it into real, editable rows at checkout.
 */

/* ------------------------------------------------------------------ *
 * Time
 * ------------------------------------------------------------------ */

/**
 * Europe/Paris as the offset in force on a given date.
 *
 * `event.startsAt` is an instant, so it needs an offset, and France has two:
 * +01:00 in winter, +02:00 under EU summer time (last Sunday of March to last
 * Sunday of October). Computed rather than assumed, because the changeover
 * weekend is exactly where a rule of thumb puts the countdown an hour out.
 */
function parisOffset(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "+01:00";

  const lastSunday = (m: number): number => {
    const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
    const weekday = new Date(Date.UTC(year, m - 1, lastDay)).getUTCDay();
    return lastDay - weekday;
  };

  const afterStart = month > 3 || (month === 3 && day >= lastSunday(3));
  const beforeEnd = month < 10 || (month === 10 && day < lastSunday(10));
  return afterStart && beforeEnd ? "+02:00" : "+01:00";
}

/**
 * Reads a wall-clock time out of the couple's own wording.
 *
 * `events.time` is free text by design (migration 20260902110000): the couple's
 * "17h00", "17 h 00" or "5pm" is kept verbatim, because a theme prints it and
 * the product does not want to normalise how they write. A countdown, though,
 * needs an instant — so the text is parsed here, and only for that.
 *
 * Returns null rather than guessing when the text yields no hour: a countdown
 * to an invented time is worse than no countdown, and the caller falls back to
 * the ceremony default instead.
 */
function parseWallClock(time: string | null | undefined): string | null {
  if (!time) return null;

  // "17h00" / "17 h 00" / "17:00" / "17h" / "5pm" / "5 pm"
  const match = time.trim().toLowerCase().match(/^(\d{1,2})\s*(?:[h:]\s*(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const meridiem = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}`;
}

/**
 * The ceremony hour assumed when a couple has not given one.
 *
 * Mirrors `themes/defaults.ts`: a wedding seeded at checkout carries this time
 * already, so the two agree and the countdown does not jump when the couple
 * first edits an unrelated field.
 */
const DEFAULT_CEREMONY_TIME = "16:00";

/* ------------------------------------------------------------------ *
 * Schedule
 * ------------------------------------------------------------------ */

/**
 * Which day of the celebration an event belongs to.
 *
 * Themes lay out day 1 and day 2 differently — a brunch is not a ceremony —
 * and the contract says so with `ScheduleEntry.day`. The database says it
 * another way, with `events.key`, so the two are reconciled here rather than
 * in each theme.
 */
function dayForEventKey(key: string): 1 | 2 {
  return key === "brunch" ? 2 : 1;
}

/* ------------------------------------------------------------------ *
 * Copy
 * ------------------------------------------------------------------ */

/** "12 · 06 · 2027" — the dotted label themes print under the names. */
function dottedLabel(isoDate: string | null): string | undefined {
  if (!isoDate) return undefined;
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return undefined;
  return `${day} · ${month} · ${year}`;
}

/* ------------------------------------------------------------------ *
 * Modules
 * ------------------------------------------------------------------ */

const KNOWN_MODULES = new Set<string>(MODULE_IDS);

/**
 * The modules a wedding bought, narrowed to the ones the contract knows.
 *
 * `sites.modules` is a text[] and can outlive a rename: an id with no
 * `ModuleId` is dropped rather than passed through, so a stale row cannot
 * reach a theme's `has()` check as a value it will never match anyway.
 *
 * An empty result is returned as `undefined`, not `[]`. The two mean opposite
 * things to a theme: `[]` is "this wedding bought nothing, render nothing",
 * while absent is "no module list — render what the data supports", which is
 * what a preview wants. A wedding that genuinely owns no module is not a case
 * that reaches here: checkout always sells at least one.
 */
function toModuleIds(modules: string[] | null | undefined): ModuleId[] | undefined {
  if (!modules?.length) return undefined;
  const known = modules.filter((id): id is ModuleId => KNOWN_MODULES.has(id));
  return known.length > 0 ? known : undefined;
}

/* ------------------------------------------------------------------ *
 * The mapper
 * ------------------------------------------------------------------ */

export function toInvitationData(page: InvitationPageData): InvitationData {
  /* -- The main event, which anchors the countdown and the day-1 label ----- */

  // `getInvitationPage` already picks the ceremony, falling back to the first
  // dated event; the matching row is found again here for its time and address.
  const mainEvent =
    page.events.find((event) => event.key === "wedding-day") ??
    page.events.find((event) => Boolean(event.date));

  const date = page.weddingDateISO;
  const time = parseWallClock(mainEvent?.time) ?? DEFAULT_CEREMONY_TIME;
  const startsAt = date ? `${date}T${time}:00${parisOffset(date)}` : "";

  /* -- Schedule ----------------------------------------------------------- */

  // `programme` is already grouped by event and ordered; flattened back here
  // because a theme lays out a day, not an event. The day-2 split is the only
  // grouping the contract keeps.
  const eventByName = new Map(page.events.map((event) => [event.name, event]));

  const schedule: ScheduleEntry[] = page.programme.flatMap((day) =>
    day.entries.map((entry) => ({
      day: dayForEventKey(eventByName.get(day.title)?.key ?? "wedding-day"),
      time: entry.time,
      title: entry.label,
      description: entry.description,
    })),
  );

  /* -- Day two ------------------------------------------------------------ */

  // A theme renders the day after as its own block rather than as timeline
  // rows, so the brunch event is surfaced separately when the couple enabled
  // one. Its schedule entries still appear above as `day: 2`.
  const brunch = page.events.find((event) => event.key === "brunch");
  const brunchDay = page.programme.find((day) => day.title === brunch?.name);

  /* -- Dress code --------------------------------------------------------- */

  // The database keeps a dress code per event (`events.dress_code`); the
  // contract has one block for the invitation. The main event's is the one a
  // theme shows, and it arrives as free text — no palette, because the couple
  // has no way to enter one yet.
  const dressCodeBody = mainEvent?.dressCode?.trim();

  /* -- RSVP --------------------------------------------------------------- */

  // Inverted so a theme reads a positive statement rather than a negation,
  // exactly as the contract documents. `adults_only` defaults to false in the
  // column, so an unanswered wedding accepts children.
  const allowChildren = !page.adultsOnly;

  return {
    // Present, so themes persist guest submissions against this wedding
    // instead of running as a demo. This single field is what separates a real
    // invitation from the showcase.
    weddingId: page.weddingId,

    couple: {
      partner1: page.partner1,
      partner2: page.partner2,
      monogram:
        [page.partner1, page.partner2]
          .map((name) => name.trim().charAt(0).toUpperCase())
          .filter(Boolean)
          .join(" & ") || undefined,
    },

    event: {
      startsAt,
      timezone: "Europe/Paris",
    },

    // Derived, not stored. None of `copy.*` has a column yet — there is no
    // screen where a couple writes their own hero line — so the labels a theme
    // needs are computed from the wedding itself rather than left blank, which
    // would print a hero with no date under the names. The wording matches
    // `themes/defaults.ts` so the page does not change when columns arrive.
    copy: {
      heroKicker: "Nous nous marions",
      dateLabel: dottedLabel(date),
      dateSpelled:
        formatFrenchWeekday(startsAt, { timeZone: "Europe/Paris" }) ?? undefined,
    },

    venue: page.venue
      ? {
          name: page.venue.name,
          city: page.venue.city,
          address: page.venue.address,
          mapsUrl: page.venue.mapsUrl,
          wazeUrl: page.venue.wazeUrl,
          image: page.venue.photoUrl,
          access: page.venue.access.length > 0 ? page.venue.access : undefined,
        }
      : // `Venue` is required by the contract and a theme prints its name; a
        // wedding with no venue row yet renders the block empty rather than
        // crashing on a missing object.
        { name: "" },

    schedule: schedule.length > 0 ? schedule : undefined,

    dayTwo: brunch
      ? {
          title: brunch.name,
          dateLabel: brunchDay?.date || undefined,
          timeLabel: brunch.time ?? undefined,
          body: brunch.description ?? undefined,
        }
      : undefined,

    dressCode: dressCodeBody ? { title: "Dress code", body: dressCodeBody } : undefined,

    stays:
      page.accommodations.length > 0
        ? page.accommodations.map((stay) => ({
            name: stay.name,
            city: stay.city,
            distance: stay.distance,
            url: stay.bookingUrl,
            offer: stay.offer,
            image: stay.photoUrl,
          }))
        : undefined,

    faq:
      page.faq.length > 0
        ? page.faq.map((entry) => ({
            // Deliberately not `entry.id`: the contract's `id` is a semantic
            // key ("children-policy") that marks an entry a setting owns, and
            // a row's uuid would never match one. A couple's own rows carry no
            // key, which is correct — their wording is theirs.
            question: entry.question,
            answer: entry.answer,
          }))
        : undefined,

    rsvp: {
      allowPartner: true,
      allowChildren,
      collectMessage: true,
      // Only asked when the couple actually enabled that event.
      collectWelcomeDinner: page.events.some((event) => event.key === "welcome-dinner"),
      collectBrunch: Boolean(brunch),
    },

    modules: toModuleIds(page.modules),
  };
}

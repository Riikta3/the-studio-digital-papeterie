import type { InvitationPageData } from "@/actions/invitation-page-actions";
import type {
  InvitationData,
  ModuleId,
  ScheduleEntry,
  ScheduleIcon,
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
 *
 * ## Two sources, one shape
 *
 * A couple's content lives in two places, because the product grew that way:
 * dedicated tables (`venues`, `schedule_entries`, `faq_entries`,
 * `accommodations`) written by the invitation screens, and
 * `site_modules.config` written by the module screens. Both are real content
 * the couple typed.
 *
 * Where they overlap, the tables win. They are the structured, newer source —
 * a venue row has an address, a maps link and a photo, while the map module
 * has three free-text fields — and the invitation screens are where the
 * dashboard points a couple first. The module config fills what the tables
 * have no column for (the venue blurb, the dress code, the transport notes,
 * the gift list) and stands in where a table is empty.
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
 * Which moment a schedule entry is, guessed from what the couple called it.
 *
 * `schedule_entries` has no icon column — the invitation screen asks for a
 * time, a title and a description — so without this every entry falls to the
 * theme's neutral mark and a timeline of five identical medallions. The
 * couple's own wording is the only signal available, and it is a good one:
 * they write "Cérémonie", "Cocktail", "Dîner".
 *
 * Deliberately conservative. An unrecognised title returns nothing rather than
 * a guess, because the neutral mark is right for anything this does not know,
 * and a cocktail glass beside "Discours de témoins" would be worse than none.
 */
function iconForTitle(title: string): ScheduleIcon | undefined {
  const text = title
    .toLowerCase()
    .normalize("NFD")
    // \u0300-\u036f is the combining-marks block NFD splits accents into.
    .replace(/[\u0300-\u036f]/g, "");

  if (/ceremonie|mariage|benediction|voeux|oui/.test(text)) return "ceremony";
  if (/cocktail|vin d.honneur|aperitif|apero|champagne/.test(text)) return "cocktail";
  if (/diner|repas|banquet|table|menu/.test(text)) return "dinner";
  if (/soiree|danse|bal|fete|dj|party/.test(text)) return "party";
  if (/brunch|petit.dejeuner|lendemain/.test(text)) return "brunch";

  return undefined;
}

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
  /** What the couple wrote on the module screens. Read throughout. */
  const mod = page.moduleContent;

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
      icon: iconForTitle(entry.label),
    })),
  );

  // Sorted by the index the form writes at save time; entries saved before
  // that existed fall back to the order they were stored in.
  const moduleSchedule: ScheduleEntry[] = mod.timeline
    .slice()
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((entry) => ({
      day: 1 as const,
      time: entry.time ?? "",
      title: entry.title ?? "",
      description: [entry.description, entry.location].filter(Boolean).join(" · ") || undefined,
      icon: iconForTitle(entry.title ?? ""),
    }));

  /* -- Day two ------------------------------------------------------------ */

  // A theme renders the day after as its own block rather than as timeline
  // rows, so the brunch event is surfaced separately when the couple enabled
  // one. Its schedule entries still appear above as `day: 2`.
  const brunch = page.events.find((event) => event.key === "brunch");
  const brunchDay = page.programme.find((day) => day.title === brunch?.name);

  /* -- Dress code --------------------------------------------------------- */

  // Two sources: `events.dress_code` (one line per event, from the events
  // screen) and the dress-code module (a title and a longer description, and
  // optionally separate guidance per audience).
  //
  // The module wins here, against the rule that tables win elsewhere: it is
  // the richer of the two and it is the screen that exists *for* this, while
  // `events.dress_code` is a field on a form about something else.
  const moduleDress = mod.dressCode;

  // In "split" mode the couple wrote for two audiences; the contract has one
  // body, so they are joined rather than one of them dropped.
  const splitBody = [
    moduleDress.descriptionMen && `Messieurs — ${moduleDress.descriptionMen}`,
    moduleDress.descriptionWomen && `Mesdames — ${moduleDress.descriptionWomen}`,
  ]
    .filter(Boolean)
    .join("\n");

  const dressCodeBody =
    (moduleDress.mode === "split" ? splitBody : moduleDress.description) ||
    mainEvent?.dressCode?.trim();

  /* -- Transport ---------------------------------------------------------- */

  // The transport module and `venue.access` describe the same thing — how to
  // get there, by mode — so the module's rows become access entries rather
  // than a section the contract has no room for. Carpooling is appended as its
  // own mode when the couple published a link.
  const transportAccess = mod.transport.options.map((option) => ({
    mode: option.title ?? option.iconType ?? "Accès",
    details: option.description ? [option.description] : [],
  }));

  if (mod.transport.carpoolUrl) {
    transportAccess.push({
      mode: "Covoiturage",
      details: [mod.transport.carpoolDescription, mod.transport.carpoolUrl].filter(
        (detail): detail is string => Boolean(detail),
      ),
    });
  }

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
      // Absent for most weddings, and that is the correct state: a theme must
      // render its closing page without one rather than substitute a stock
      // image. blanc-couture used to hardcode the demo couple's portrait here.
      portrait: page.couplePhotoUrl,
      monogram:
        [page.partner1, page.partner2]
          .map((name) => name.trim().charAt(0).toUpperCase())
          .filter(Boolean)
          .join(" & ") || undefined,
    },

    event: {
      startsAt,
      // From the RSVP module, the only place a couple sets it. Themes format
      // it themselves, so they get the ISO day rather than the label the
      // dashboard also stores.
      rsvpDeadline: mod.rsvpDeadline,
      timezone: "Europe/Paris",
    },

    // The date labels are derived, because a hero with no date under the names
    // looks broken and no screen asks for a preformatted one. The rest is the
    // couple's own: the hero line, the announcement and the closing words come
    // from `settings` (20260912140000), and the section intros are the module
    // screens' `description` fields. The literal below is now only a fallback
    // for a couple who has not written their own — before that column existed
    // it was every wedding's hero line.
    copy: {
      heroKicker: page.heroKicker ?? "Nous nous marions",
      announcement: page.announcement,
      closing: page.closingWords,
      dateLabel: dottedLabel(date),
      dateSpelled:
        formatFrenchWeekday(startsAt, { timeZone: "Europe/Paris" }) ?? undefined,
      venueIntro: mod.venue.description,
      staysIntro: mod.accommodation.description,
      playlistIntro: mod.playlist.description,
      // Only for rows saved before the ISO deadline existed: those carry a
      // pre-formatted label and nothing a theme can compute with, so it is
      // printed as a note. With an ISO value the themes format it themselves
      // from `event.rsvpDeadline`, and this stays out of their way.
      rsvpNote:
        !mod.rsvpDeadline && mod.rsvpDeadlineLabel
          ? `Merci de répondre avant le ${mod.rsvpDeadlineLabel}.`
          : undefined,
    },

    venue: {
      // The venue row wins; the map module stands in when it is empty, which
      // is the case for a couple who only ever opened the module screen.
      name: page.venue?.name || mod.venue.name || "",
      city: page.venue?.city,
      address: page.venue?.address || mod.venue.address,
      mapsUrl: page.venue?.mapsUrl,
      wazeUrl: page.venue?.wazeUrl,
      image: page.venue?.photoUrl || mod.venue.imageUrl,
      access:
        page.venue && page.venue.access.length > 0
          ? page.venue.access
          : // The transport module is the same idea in another shape: one
            // mode, one set of directions.
            transportAccess.length > 0
            ? transportAccess
            : undefined,
    },

    // `schedule_entries` wins; the timeline module stands in when the couple
    // built their programme there instead. Its entries carry a `location`
    // the contract has no field for, so it is folded into the description.
    schedule:
      schedule.length > 0
        ? schedule
        : moduleSchedule.length > 0
          ? moduleSchedule
          : undefined,

    dayTwo: brunch
      ? {
          title: brunch.name,
          dateLabel: brunchDay?.date || undefined,
          timeLabel: brunch.time ?? undefined,
          body: brunch.description ?? undefined,
        }
      : undefined,

    // From the gift-list module, the only place a couple writes this. Absent
    // when they wrote nothing, so a theme renders no gift section at all
    // rather than one promising arrangements they never made.
    gifts:
      mod.giftList.description || mod.giftList.url
        ? {
            body: mod.giftList.description,
            url: mod.giftList.url,
            linkLabel: mod.giftList.label,
          }
        : undefined,

    // The palette, the photograph and the closing note are rendered by all
    // three themes and were written by no screen, so the feature was
    // unreachable. Present even when the couple wrote no guidance: a palette
    // on its own is a legitimate dress code — "wear these colours" — and
    // dropping it because `body` is empty would hide what they did set.
    dressCode:
      dressCodeBody || moduleDress.colors || moduleDress.imageUrl || moduleDress.note
        ? {
            title: moduleDress.subtitle ?? moduleDress.title ?? "Dress code",
            body: dressCodeBody || undefined,
            colors: moduleDress.colors,
            image: moduleDress.imageUrl,
            note: moduleDress.note,
          }
        : undefined,

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
        : mod.accommodation.options.length > 0
          ? mod.accommodation.options.map((option) => ({
              name: option.name ?? "",
              distance: option.distance,
              // The module has no `offer` column; its free-text description is
              // where a couple writes "code X : -10 %".
              offer: option.description,
              url: option.url,
            }))
          : undefined,

    // Both sources are concatenated rather than one winning: a couple may have
    // written some questions on the FAQ screen and others in the module, and
    // dropping either would lose answers their guests need. Duplicates are not
    // deduplicated — there is no reliable key, and a repeated question is a
    // smaller problem than a missing answer.
    faq:
      page.faq.length > 0 || mod.faq.questions.length > 0
        ? [
            ...page.faq.map((entry) => ({
              // Deliberately not `entry.id`: the contract's `id` is a semantic
              // key ("children-policy") that marks an entry a setting owns,
              // and a row's uuid would never match one. A couple's own rows
              // carry no key, which is correct — their wording is theirs.
              question: entry.question,
              answer: entry.answer,
            })),
            ...mod.faq.questions.map((entry) => ({
              question: entry.question ?? "",
              answer: entry.answer ?? "",
            })),
          ]
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

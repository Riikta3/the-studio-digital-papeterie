import { formatFrenchDate, formatFrenchWeekday } from "./format";
import type { InvitationData, ModuleId, ScheduleIcon } from "./types";

/**
 * The content a wedding starts life with.
 *
 * A couple who has just paid must land on an invitation that already exists:
 * their names, their date, their venue, and a plausible programme underneath
 * that they edit down rather than write from nothing. An empty shell gives
 * them no idea what the product does, and a copy of a demo gives them someone
 * else's wedding to delete.
 *
 * ## Why this is not `demo-data.ts`
 *
 * The two files look alike and their jobs are opposite. A demo dataset sells:
 * it is allowed to be a specific, beautiful wedding on the Amalfi coast, and
 * the showcase would be worse if it were not. Defaults disappear: their whole
 * purpose is to be replaced, so anything specific in them — a venue, a region,
 * a couple's turn of phrase — is something the couple has to notice and undo.
 *
 * Keeping them apart lets each do its job. That is why `demo-data.ts` still
 * says "Villa Cimbrone" and nothing here does.
 *
 * ## Neutral, but not generic
 *
 * Every default below is either theme-agnostic copy a couple would plausibly
 * keep, or is derived from what they actually typed at checkout. The
 * invitation therefore reads as *theirs* from the first second — the hero
 * carries their names, the schedule is built around their own ceremony time,
 * the FAQ names their venue — without asserting a single fact they did not
 * give us.
 *
 * Nothing here is written in a theme's voice: these values are the starting
 * point for every theme, and a theme's own personality belongs in its markup
 * and its stylesheet, not in the couple's data.
 */

/* ------------------------------------------------------------------ *
 * Inputs
 * ------------------------------------------------------------------ */

/**
 * What checkout actually knows about a wedding.
 *
 * Deliberately narrow: this is the subset of the order form that describes the
 * couple rather than the purchase. Everything else in `InvitationData` is a
 * default, which is the point of this module.
 */
export type WeddingSeed = {
  partner1: string;
  partner2: string;
  /** ISO date (YYYY-MM-DD) of the ceremony. */
  weddingDate: string;
  /**
   * Free text, exactly as typed at checkout — "Château de la Roche", "chez
   * mes parents", or a full address. It is never parsed: a couple's venue at
   * this stage is a name they have in mind, not a structured record.
   */
  venue?: string;
  /** Modules the couple bought, in render order. */
  modules?: ModuleId[];
};

/* ------------------------------------------------------------------ *
 * Time
 * ------------------------------------------------------------------ */

/**
 * The ceremony hour a wedding starts with.
 *
 * Checkout asks for a date, not a time — most couples have not fixed one when
 * they buy, and asking would lengthen the form for an answer they would have
 * to guess. Late afternoon is the common case for a French wedding and reads
 * as a placeholder rather than a claim, and the couple corrects it in the
 * dashboard.
 *
 * It matters that this exists at all: the countdown needs a real instant, and
 * a wedding with no time would either show a countdown to midnight or show no
 * countdown at all on a module the couple may have paid for.
 */
const DEFAULT_CEREMONY_TIME = "16:00";

/**
 * Europe/Paris, as a fixed offset.
 *
 * `InvitationData.event.startsAt` is an instant, so it needs an offset rather
 * than a zone name, and the two cannot be reconciled without knowing the date:
 * France is +01:00 in winter and +02:00 in summer. This picks the offset that
 * is actually in force on the wedding's own date.
 *
 * EU summer time runs from the last Sunday of March to the last Sunday of
 * October. Computed rather than approximated, because a wedding on the
 * changeover weekend is exactly the case a rule of thumb gets wrong — and
 * spring and autumn weddings sit close to both edges.
 */
function parisOffset(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return "+01:00";

  /** The last Sunday of `month` (1-indexed) in `year`, as a day of the month. */
  const lastSunday = (m: number): number => {
    const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
    const weekday = new Date(Date.UTC(year, m - 1, lastDay)).getUTCDay();
    return lastDay - weekday;
  };

  const afterStart =
    month > 3 || (month === 3 && day >= lastSunday(3));
  const beforeEnd =
    month < 10 || (month === 10 && day < lastSunday(10));

  return afterStart && beforeEnd ? "+02:00" : "+01:00";
}

/** The couple's wedding date as the instant the countdown counts down to. */
function startsAt(weddingDate: string): string {
  return `${weddingDate}T${DEFAULT_CEREMONY_TIME}:00${parisOffset(weddingDate)}`;
}

/** `YYYY-MM-DD`, `monthsBefore` months before the wedding. */
function monthsBefore(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  const target = new Date(Date.UTC(year, month - 1 - months, 1));
  // Clamp: 31 May minus 3 months is 28 or 29 February, not 31 February.
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${target.getUTCFullYear()}-${pad(target.getUTCMonth() + 1)}-${pad(target.getUTCDate())}`;
}

/** "12 · 06 · 2027" — the dotted label themes print under the names. */
function dottedLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return [day, month, year].filter(Boolean).join(" · ");
}

/* ------------------------------------------------------------------ *
 * Defaults
 * ------------------------------------------------------------------ */

/**
 * The RSVP deadline a wedding starts with: two months before the day.
 *
 * Late enough that guests are not chased a year out, early enough that the
 * couple can give numbers to a caterer. Editable like everything else.
 */
const RSVP_MONTHS_BEFORE = 2;

/**
 * The starting programme.
 *
 * Times are relative to the ceremony rather than written down, so the schedule
 * stays coherent when the couple moves their ceremony — a fixed "18 h 00
 * cocktail" under a 20 h ceremony is worse than no schedule at all.
 *
 * `icon` keys are the closed set the themes draw. They are named for what
 * happens, not for a theme's artwork.
 */
const SCHEDULE_OFFSETS: ReadonlyArray<{
  minutes: number;
  title: string;
  description: string;
  icon: ScheduleIcon;
}> = [
  {
    minutes: 0,
    title: "Cérémonie",
    description: "Le moment que nous attendons tous.",
    icon: "ceremony",
  },
  {
    minutes: 60,
    title: "Cocktail",
    description: "Le temps de trinquer et de se retrouver.",
    icon: "cocktail",
  },
  {
    minutes: 210,
    title: "Dîner",
    description: "À table, tous ensemble.",
    icon: "dinner",
  },
  {
    minutes: 390,
    title: "Soirée dansante",
    description: "La fête commence.",
    icon: "party",
  },
];

/** "16 h 00" — the spacing French typography uses, and the themes expect. */
function frenchTime(iso: string, offsetMinutes: number): string {
  const at = new Date(new Date(iso).getTime() + offsetMinutes * 60_000);
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(at);
  return formatted.replace(":", " h ");
}

/* ------------------------------------------------------------------ *
 * The seed
 * ------------------------------------------------------------------ */

/**
 * The invitation a couple owns the moment they finish checkout.
 *
 * Pure: it reads nothing and writes nothing, so the same seed can be inserted
 * into the database at purchase, rendered in a preview, or asserted against in
 * a test. Callers persist the parts they need as real rows — the couple has to
 * be able to edit this from the dashboard, and only rows are editable.
 */
export function defaultInvitationData(seed: WeddingSeed): InvitationData {
  const iso = startsAt(seed.weddingDate);
  const deadline = monthsBefore(seed.weddingDate, RSVP_MONTHS_BEFORE);

  // The venue is free text at this stage: whatever the couple typed is the
  // name, and no city or address is invented around it. A theme prints
  // `name · city` and must not be handed a guess.
  //
  // `Venue.name` is required by the contract, so a couple who skipped the
  // field gets an empty string rather than a missing key — themes already
  // guard on falsiness to hide the block, and inventing a placeholder name
  // would put a word on their invitation that they never wrote.
  const venueName = seed.venue?.trim() ?? "";

  return {
    couple: {
      partner1: seed.partner1,
      partner2: seed.partner2,
      // Initials, which is what a theme falls back to anyway — spelled out
      // here so the value is in the data rather than in each theme's markup.
      monogram: [seed.partner1, seed.partner2]
        .map((name) => name.trim().charAt(0).toUpperCase())
        .filter(Boolean)
        .join(" & "),
    },

    event: {
      startsAt: iso,
      rsvpDeadline: deadline,
      timezone: "Europe/Paris",
    },

    venue: {
      name: venueName,
    },

    copy: {
      heroKicker: "Nous nous marions",
      announcement: "Nous serions heureux de vous compter parmi nous.",
      dateLabel: dottedLabel(seed.weddingDate),
      // `?? undefined`: the formatters return null for an unparseable date,
      // and `copy.*` is `string | undefined` — an explicit null would render.
      dateSpelled: formatFrenchWeekday(iso, { timeZone: "Europe/Paris" }) ?? undefined,
      scheduleIntro: "Le déroulé de notre journée.",
      rsvpIntro: "Votre réponse nous aidera à tout préparer.",
      playlistIntro: "Aidez-nous à composer la bande-son de la soirée.",
      staysIntro: "Quelques adresses pour passer la nuit sur place.",
      closing: "À très bientôt",
    },

    schedule: SCHEDULE_OFFSETS.map((entry) => ({
      day: 1 as const,
      time: frenchTime(iso, entry.minutes),
      title: entry.title,
      description: entry.description,
      icon: entry.icon,
    })),

    dressCode: {
      title: "Tenue de fête",
      body: "Nous n'imposons pas de code couleur : venez comme vous vous sentez beau.",
      note: "Une seule règle : le blanc est réservé à la mariée.",
    },

    // Left empty on purpose. An invented hotel is a fact the couple did not
    // give us and a guest could act on; an empty list simply hides the
    // section until they add a real one.
    stays: [],
    playlist: [],

    faq: [
      {
        question: "Puis-je venir accompagné ?",
        answer:
          "Votre invitation précise le nombre de personnes attendues. En cas de doute, écrivez-nous.",
      },
      {
        question: "À quelle heure faut-il arriver ?",
        answer: `Nous vous attendons un peu avant ${frenchTime(iso, -30)}, afin que la cérémonie puisse commencer à l'heure.`,
      },
      {
        question: "Jusqu'à quelle date répondre ?",
        answer: `Merci de nous confirmer votre présence avant le ${formatFrenchDate(deadline)}.`,
      },
    ],

    rsvp: {
      allowPartner: true,
      collectMessage: true,
      // `allowChildren` is intentionally absent: it mirrors
      // `settings.adults_only`, which the couple already answered in the
      // studio. Setting it here would override their answer with a guess.
    },

    modules: seed.modules,
  };
}

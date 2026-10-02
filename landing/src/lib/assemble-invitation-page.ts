import { normaliseTexts } from "@shared/data/invitation-texts";
import type { InvitationRows } from "@shared/types/invitation-rows";

import {
  type ModuleConfigRow,
  type ModuleContent,
  readModuleConfigs,
} from "./module-config";

/**
 * A couple's invitation, assembled from the rows it is stored in.
 *
 * Split out of `getInvitationPage` so that two callers share it:
 *
 *   - the public route, which reads the rows from Supabase for a slug;
 *   - the editor's live preview (`/invitation/apercu`), which receives the
 *     couple's unsaved draft from the dashboard in the same row shape.
 *
 * Pure: no database, no request. That is what lets the preview promise it
 * shows exactly what guests will see once the draft is saved — it is this
 * function, on the same input.
 */

export type InvitationAccess = {
  mode: string;
  details: string[];
};

export type InvitationTimelineEntry = {
  time: string;
  label: string;
  description?: string;
  /** `schedule_entries.icon` — one of `SCHEDULE_ICONS`, narrowed by the mapper. */
  icon?: string;
  image?: string;
};

export type InvitationProgrammeDay = {
  /** The event's `key` — its name is the couple's, and two may share one. */
  key: string;
  title: string;
  date: string;
  entries: InvitationTimelineEntry[];
};

export type InvitationAccommodation = {
  id: string;
  name: string;
  city?: string;
  distance?: string;
  phone?: string;
  bookingUrl?: string;
  offer?: string;
  photoUrl?: string;
  address?: string;
  /** Listed behind the theme's "voir plus d'options" toggle. */
  secondary?: boolean;
};

export type InvitationFaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export type InvitationEvent = {
  id: string;
  key: string;
  name: string;
  date?: string;
  time?: string;
  address?: string;
  description?: string;
  dressCode?: string;
};

export type InvitationPageData = {
  weddingId: string;
  slug: string;
  themeId: string | null;
  /**
   * The modules this wedding bought (`sites.modules`), which decide the
   * sections a theme renders. Empty when the row carries none.
   */
  modules: string[];
  /** `settings.adults_only` — drives the RSVP child fields and the FAQ entry. */
  adultsOnly: boolean;
  /**
   * The couple's own words and their photograph (`settings`, migration
   * 20260912140000).
   *
   * `InvitationData.copy` describes every one of its fields as "a sentence a
   * couple could rewrite", and until these columns existed none of them could
   * be: the hero line was a French literal in the mapper, so two weddings on
   * the same theme opened with the same sentence. Each is undefined when the
   * couple has not written it, and the mapper falls back to what it derived
   * before.
   */
  heroKicker?: string;
  announcement?: string;
  closingWords?: string;
  couplePhotoUrl?: string;
  /**
   * Everything else the couple rewrote, from the invitation editor
   * (`settings.invitation_texts`, migration 20260927120000): contract copy
   * under `copy.*` / `couple.*` / `dayTwo.*`, and theme slots. Already cleaned.
   */
  texts: Record<string, string>;
  /**
   * The locales this invitation may be served in (`sites.languages`), the
   * couple's default first. A locale outside this list is not one they bought.
   */
  languages: string[];
  /**
   * What the couple wrote on the dashboard's module screens
   * (`site_modules.config`), which nothing read until now.
   */
  moduleContent: ModuleContent;
  partner1: string;
  partner2: string;
  /** ISO date of the main ceremony, for the countdown. */
  weddingDateISO: string | null;
  events: InvitationEvent[];
  programme: InvitationProgrammeDay[];
  venue: {
    name: string;
    address?: string;
    city?: string;
    mapsUrl?: string;
    wazeUrl?: string;
    parkingInfo?: string;
    accessInfo?: string;
    transportInfo?: string;
    photoUrl?: string;
    access: InvitationAccess[];
  } | null;
  accommodations: InvitationAccommodation[];
  faq: InvitationFaqEntry[];
  /**
   * The Jour J, when the couple switched it on. Set by the public loader from
   * `public_day_of_settings`; the editor's preview never has it, so a draft
   * shows no Jour J blocks.
   */
  dayOf?: { photos: boolean };
  /**
   * The invitation's music, when the site owns the `custom-music` option and
   * the couple left it on. Set by the public loader from `resolve_public_slug`,
   * which blanks it otherwise; the editor's preview never has it, and no theme
   * reads it — the page mounts the player beside the theme.
   */
  music?: { src: string } | null;
};

/**
 * `public_day_of_settings` answers one row when the Jour J is enabled and
 * nothing when it is off, so "no row" means "not available".
 *
 * `photos` is true while guests can still upload (the window is open) or look
 * (the gallery is visible); otherwise the photos page would be an empty room.
 * `now` is a parameter so the rule can be tested.
 */
export function readDayOf(
  rows: unknown,
  now: number = Date.now(),
): { photos: boolean } | undefined {
  const row = Array.isArray(rows) ? rows[0] : rows;
  if (!row || typeof row !== "object") return undefined;

  const settings = row as { uploads_open_until?: unknown; gallery_visible_to_guests?: unknown };
  const until =
    typeof settings.uploads_open_until === "string" ? Date.parse(settings.uploads_open_until) : NaN;

  return { photos: until > now || settings.gallery_visible_to_guests === true };
}

/**
 * A trimmed string from an untyped column, or undefined.
 *
 * An empty string in one of the copy columns means "not written" rather than
 * "written as blank" — a theme that received `""` would render an empty line
 * where its fallback belonged.
 */
function text(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Long French date, e.g. "samedi 19 juin 2027", for a heading. */
function frenchDateLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  // Parse the parts by hand: `new Date("YYYY-MM-DD")` is UTC midnight, which
  // renders as the previous day in any negative-offset timezone.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

/**
 * Turns the couple's free-text practical notes into the `{ mode, details }`
 * rows the theme's access section renders. Each field is one mode; its lines
 * are split on newlines so a couple can type a short list.
 */
function buildAccess(row: {
  transport_info?: string | null;
  parking_info?: string | null;
  access_info?: string | null;
}): InvitationAccess[] {
  const split = (value?: string | null) =>
    (value ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  return (
    [
      { mode: "Transports", details: split(row.transport_info) },
      { mode: "Stationnement", details: split(row.parking_info) },
      { mode: "Accès", details: split(row.access_info) },
    ] satisfies InvitationAccess[]
  ).filter((entry) => entry.details.length > 0);
}

/**
 * The invitation a set of rows describes, or null when there is nothing to
 * show.
 *
 * A wedding with no enabled event is treated as unpublished rather than
 * rendered as an empty shell — the public route 404s on it, and the preview
 * explains it to the couple instead.
 */
export function assembleInvitationPage(
  weddingId: string,
  slug: string,
  rows: InvitationRows,
): InvitationPageData | null {
  const { site, names } = rows;

  const events: InvitationEvent[] = rows.events.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    date: row.date ?? undefined,
    time: row.time ?? undefined,
    address: row.address ?? undefined,
    description: row.description ?? undefined,
    dressCode: row.dress_code ?? undefined,
  }));

  if (events.length === 0) return null;

  // Group the programme under its event, so a brunch cannot appear between the
  // ceremony and the dinner. Events are already in display order; entries are
  // sorted here because the preview's rows arrive in whatever order the
  // couple's draft holds them.
  const entriesByEvent = new Map<string, InvitationTimelineEntry[]>();
  const schedule = rows.schedule
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  for (const row of schedule) {
    const entry: InvitationTimelineEntry = {
      time: row.time,
      label: row.title,
      description: row.description ?? undefined,
      icon: row.icon ?? undefined,
      image: row.image_url ?? undefined,
    };
    const bucket = entriesByEvent.get(row.event_id);
    if (bucket) bucket.push(entry);
    else entriesByEvent.set(row.event_id, [entry]);
  }

  const programme: InvitationProgrammeDay[] = events
    .map((event) => ({
      key: event.key,
      title: event.name,
      date: frenchDateLabel(event.date),
      entries: entriesByEvent.get(event.id) ?? [],
    }))
    .filter((day) => day.entries.length > 0);

  // The ceremony drives the countdown. Fall back to the first dated event so a
  // couple who renamed their main event still gets a working countdown.
  const mainEvent =
    events.find((event) => event.key === "wedding-day") ??
    events.find((event) => Boolean(event.date));

  const venueRow = rows.venue;

  return {
    weddingId,
    slug,
    themeId: site.theme_id ?? null,
    modules: site.modules ?? [],
    adultsOnly: Boolean(site.adults_only),
    heroKicker: text(site.hero_kicker),
    announcement: text(site.announcement),
    closingWords: text(site.closing_words),
    couplePhotoUrl: text(site.couple_photo_url),
    texts: normaliseTexts(site.invitation_texts),
    languages: site.languages ?? [],
    moduleContent: readModuleConfigs(rows.moduleConfigs as ModuleConfigRow[]),
    partner1: names?.first_name ?? "",
    partner2: names?.partner_name ?? "",
    weddingDateISO: mainEvent?.date ?? null,
    events,
    programme,
    venue: venueRow
      ? {
          name: venueRow.name,
          address: venueRow.address ?? undefined,
          city: venueRow.city ?? undefined,
          mapsUrl: venueRow.maps_url ?? undefined,
          wazeUrl: venueRow.waze_url ?? undefined,
          parkingInfo: venueRow.parking_info ?? undefined,
          accessInfo: venueRow.access_info ?? undefined,
          transportInfo: venueRow.transport_info ?? undefined,
          photoUrl: venueRow.photo_url ?? undefined,
          access: buildAccess(venueRow),
        }
      : null,
    accommodations: rows.accommodations.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city ?? undefined,
      distance: row.distance ?? undefined,
      phone: row.phone ?? undefined,
      bookingUrl: row.booking_url ?? undefined,
      offer: row.offer ?? undefined,
      photoUrl: row.photo_url ?? undefined,
      address: row.address ?? undefined,
      secondary: row.secondary === true,
    })),
    faq: rows.faq.map((row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
    })),
  };
}

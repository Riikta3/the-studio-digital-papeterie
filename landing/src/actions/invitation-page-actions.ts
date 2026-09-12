"use server";

import { createClient } from "@/utils/supabase/server";
import {
  type ModuleConfigRow,
  type ModuleContent,
  readModuleConfigs,
} from "@/lib/module-config";

/**
 * The couple's real invitation, assembled from Supabase.
 *
 * Until now the only invitation pages in this app were static showcases
 * (`/invitation/demo`, `/invitation/mediterranean-classy`) reading from
 * `src/lib/*-demo-data.ts`. There was no route that rendered a *real* couple's
 * invitation, so everything the couple typed into the dashboard — their venue,
 * their programme, their FAQ — had nowhere to appear. This is that route's
 * data source.
 *
 * Reads go through the ANON client, exactly like the Jour J guest page: an
 * invitation is public to anyone holding its link, and `supabaseAdmin` would
 * let a crafted request reach anything in the database. Every table below has
 * an anon select policy gated on the wedding's own visibility.
 *
 * Guest data is never read here. An invitation shows the event, not the guest
 * list — the only path to a guest is the Jour J search RPC.
 */

export type InvitationAccess = {
  mode: string;
  details: string[];
};

export type InvitationTimelineEntry = {
  time: string;
  label: string;
  description?: string;
};

export type InvitationProgrammeDay = {
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
};

/**
 * A trimmed string from an untyped RPC column, or undefined.
 *
 * `rpc()` rows are `any`, and an empty string in one of the copy columns means
 * "not written" rather than "written as blank" — a theme that received `""`
 * would render an empty line where its fallback belonged.
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
  const split = (text?: string | null) =>
    (text ?? "")
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
 * Resolves a public slug to the couple's invitation.
 *
 * Returns null for an unknown slug and for a site that is not published, and
 * the caller 404s on both — indistinguishable from outside, so this route
 * cannot be used to discover which couples exist.
 */
export async function getInvitationPage(
  slug: string,
): Promise<InvitationPageData | null> {
  if (!slug) return null;

  const supabase = await createClient();

  // Via `resolve_public_slug` rather than reading `sites`: the broad anon
  // policy that used to allow that leaked every column and let anyone list
  // every published slug (20260903120000 replaced it).
  const { data: resolved, error: siteError } = await supabase.rpc(
    "resolve_public_slug",
    { p_slug: slug },
  );

  const site = resolved?.[0];
  if (siteError || !site?.wedding_id) return null;

  const weddingId = site.wedding_id as string;

  const [namesRes, eventsRes, scheduleRes, venueRes, staysRes, faqRes, modulesRes] =
    await Promise.all([
      // The couple's names live on `profiles`, which anon cannot read. This
      // security-definer RPC is the narrow path to just the two display names
      // (see 20260902190000_couple_display_names.sql).
      supabase.rpc("get_couple_display_names", { p_wedding_id: weddingId }),
      // Same narrow-RPC reason as the names above: the anon policy on `events`
      // returned every wedding's events to a direct PostgREST call, so it was
      // replaced by this function in 20260911110000_narrow_events_anon_read.sql.
      supabase.rpc("public_wedding_events", { p_wedding_id: weddingId }),
      supabase
        .from("schedule_entries")
        .select("id, event_id, time, title, description, position")
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
      supabase
        .from("venues")
        .select(
          "name, address, city, maps_url, waze_url, parking_info, access_info, transport_info, photo_url",
        )
        .eq("wedding_id", weddingId)
        .maybeSingle(),
      supabase
        .from("accommodations")
        .select("id, name, city, distance, phone, booking_url, offer, photo_url")
        .eq("wedding_id", weddingId)
        .order("position", { ascending: true }),
      supabase
        .from("faq_entries")
        .select("id, question, answer, position")
        .eq("wedding_id", weddingId)
        .eq("published", true)
        .order("position", { ascending: true }),
      // Per-module content. Through an RPC for the same reason as the events
      // above: `site_modules` has no anon policy and must not gain one.
      supabase.rpc("public_module_configs", { p_wedding_id: weddingId }),
    ]);

  const names = namesRes.data?.[0];

  /** One row of `public_wedding_events` (20260911110000_narrow_events_anon_read.sql). */
  type PublicEventRow = {
    id: string;
    key: string;
    name: string;
    date: string | null;
    time: string | null;
    address: string | null;
    description: string | null;
    dress_code: string | null;
    position: number | null;
  };

  // `rpc()` gives back an untyped row (the generated types do not cover the
  // function), so the shape is named explicitly before mapping.
  const events = ((eventsRes.data ?? []) as PublicEventRow[]).map((row) => ({
    id: row.id as string,
    key: row.key as string,
    name: row.name as string,
    date: (row.date as string | null) ?? undefined,
    time: (row.time as string | null) ?? undefined,
    address: (row.address as string | null) ?? undefined,
    description: (row.description as string | null) ?? undefined,
    dressCode: (row.dress_code as string | null) ?? undefined,
  }));

  // A wedding with no enabled event has nothing to show. Treat it as
  // unpublished rather than rendering an empty shell.
  if (events.length === 0) return null;

  // Group the programme under its event, so a brunch cannot appear between the
  // ceremony and the dinner. Events are already in display order.
  const entriesByEvent = new Map<string, InvitationTimelineEntry[]>();
  for (const row of scheduleRes.data ?? []) {
    const eventId = row.event_id as string;
    const entry: InvitationTimelineEntry = {
      time: row.time as string,
      label: row.title as string,
      description: (row.description as string | null) ?? undefined,
    };
    const bucket = entriesByEvent.get(eventId);
    if (bucket) bucket.push(entry);
    else entriesByEvent.set(eventId, [entry]);
  }

  const programme: InvitationProgrammeDay[] = events
    .map((event) => ({
      title: event.name,
      date: frenchDateLabel(event.date),
      entries: entriesByEvent.get(event.id) ?? [],
    }))
    .filter((day) => day.entries.length > 0);

  const venueRow = venueRes.data;

  // The ceremony drives the countdown. Fall back to the first dated event so a
  // couple who renamed their main event still gets a working countdown.
  const mainEvent =
    events.find((e) => e.key === "wedding-day") ??
    events.find((e) => Boolean(e.date));

  return {
    weddingId,
    slug,
    themeId: (site.theme_id as string | null) ?? null,
    modules: (site.modules as string[] | null) ?? [],
    adultsOnly: Boolean(site.adults_only),
    heroKicker: text(site.hero_kicker),
    announcement: text(site.announcement),
    closingWords: text(site.closing_words),
    couplePhotoUrl: text(site.couple_photo_url),
    languages: (site.languages as string[] | null) ?? [],
    // `rpc()` returns untyped rows (the generated types do not cover
    // functions), so the shape is named before it is narrowed.
    moduleContent: readModuleConfigs((modulesRes.data ?? []) as ModuleConfigRow[]),
    partner1: (names?.first_name as string | null) ?? "",
    partner2: (names?.partner_name as string | null) ?? "",
    weddingDateISO: mainEvent?.date ?? null,
    events,
    programme,
    venue: venueRow
      ? {
          name: venueRow.name as string,
          address: (venueRow.address as string | null) ?? undefined,
          city: (venueRow.city as string | null) ?? undefined,
          mapsUrl: (venueRow.maps_url as string | null) ?? undefined,
          wazeUrl: (venueRow.waze_url as string | null) ?? undefined,
          parkingInfo: (venueRow.parking_info as string | null) ?? undefined,
          accessInfo: (venueRow.access_info as string | null) ?? undefined,
          transportInfo:
            (venueRow.transport_info as string | null) ?? undefined,
          photoUrl: (venueRow.photo_url as string | null) ?? undefined,
          access: buildAccess(venueRow),
        }
      : null,
    accommodations: (staysRes.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      city: (row.city as string | null) ?? undefined,
      distance: (row.distance as string | null) ?? undefined,
      phone: (row.phone as string | null) ?? undefined,
      bookingUrl: (row.booking_url as string | null) ?? undefined,
      offer: (row.offer as string | null) ?? undefined,
      photoUrl: (row.photo_url as string | null) ?? undefined,
    })),
    faq: (faqRes.data ?? []).map((row) => ({
      id: row.id as string,
      question: row.question as string,
      answer: row.answer as string,
    })),
  };
}

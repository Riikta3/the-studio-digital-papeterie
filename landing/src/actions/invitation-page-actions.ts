"use server";

import { createClient } from "@/utils/supabase/server";

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

  const [namesRes, eventsRes, scheduleRes, venueRes, staysRes, faqRes] =
    await Promise.all([
      // The couple's names live on `profiles`, which anon cannot read. This
      // security-definer RPC is the narrow path to just the two display names
      // (see 20260902190000_couple_display_names.sql).
      supabase.rpc("get_couple_display_names", { p_wedding_id: weddingId }),
      supabase
        .from("events")
        .select("id, key, name, date, time, address, description, dress_code")
        .eq("wedding_id", weddingId)
        .eq("enabled", true)
        .order("position", { ascending: true }),
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
    ]);

  const names = namesRes.data?.[0];
  const events = (eventsRes.data ?? []).map((row) => ({
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

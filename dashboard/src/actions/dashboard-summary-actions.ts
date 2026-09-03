"use server";

import { requireWedding } from "@/lib/db/current-wedding";

/**
 * Read actions only: both functions here back Server Component pages (the
 * home screen and `/stats`), so a real database error is left to throw and
 * surface as an error boundary — see action-conventions.md.
 */

export type DashboardSummary = {
  weddingDate: string | null;
  coupleNames: { first: string; second: string } | null;
  guests: { total: number; confirmed: number; pending: number; children: number };
  seating: { seated: number; toSeat: number };
  media: { total: number };
  dayOf: { enabled: boolean; qrSlug: string | null };
};

/**
 * The home screen's aggregates only — no guest rows, no household rows, just
 * the numbers `KpiGroupCard`/`CountdownTimer`/`InvitationPreviewCard` render.
 *
 * `weddings` carries no bride/groom name (only `id, user_id, partner_name,
 * wedding_date, created_at`); the couple's names live on `profiles`
 * (`first_name`, `partner_name`), joined on `weddings.user_id`. The date
 * comes from `weddings.wedding_date` — reading it off `profiles` is the bug
 * step 1 fixed (the column does not exist there), do not reintroduce it.
 *
 * The ten counters come from one `dashboard_counts` RPC rather than ten
 * separate `count: "exact"` queries. Measured against the seeded wedding, the
 * old shape cost 317ms even fired in parallel, because each count paid its own
 * round trip to eu-west-2; Postgres computes all ten in a single pass.
 *
 * The RPC returns counts only — never guest rows. Counting 140 guests by
 * fetching them would drag guest PII (names, dietary data) into a server
 * component that has no use for it, so nothing here selects a guest row.
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { supabase, weddingId, user } = await requireWedding();

  const [profileRes, weddingRes, siteRes, dayOfRes, countsRes] = await Promise.all([
    supabase.from("profiles").select("first_name, partner_name").eq("id", user.id).single(),
    supabase.from("weddings").select("wedding_date").eq("id", weddingId).single(),
    supabase.from("sites").select("slug").eq("wedding_id", weddingId).maybeSingle(),
    supabase
      .from("day_of_settings")
      .select("enabled")
      .eq("wedding_id", weddingId)
      .maybeSingle(),
    supabase.rpc("dashboard_counts", { p_wedding_id: weddingId }),
  ]);

  if (weddingRes.error) throw new Error(weddingRes.error.message);
  if (countsRes.error) throw new Error(countsRes.error.message);

  // The RPC checks ownership itself and returns no row for a wedding the
  // caller does not own. `requireWedding` already resolved this one from the
  // session, so an empty result here means a wedding with nothing in it.
  const counts = countsRes.data?.[0];

  const profile = profileRes.data;
  const totalGuests = counts?.guests_total ?? 0;
  const confirmedGuests = counts?.guests_confirmed ?? 0;
  const seatedCount = counts?.guests_seated ?? 0;

  // "To seat" is confirmed guests still unassigned — confirmed minus seated,
  // never negative (a guest can be seated before their RSVP is recorded as
  // confirmed in edge cases, e.g. manual seating ahead of an RSVP update).
  const toSeatCount = Math.max(confirmedGuests - seatedCount, 0);

  return {
    weddingDate: weddingRes.data?.wedding_date ?? null,
    coupleNames: profile
      ? { first: profile.first_name || "Mariés", second: profile.partner_name || "Partenaire" }
      : null,
    guests: {
      total: totalGuests,
      confirmed: confirmedGuests,
      pending: counts?.guests_pending ?? 0,
      children: counts?.guests_children ?? 0,
    },
    seating: { seated: seatedCount, toSeat: toSeatCount },
    media: { total: counts?.media_total ?? 0 },
    dayOf: {
      enabled: dayOfRes.data?.enabled ?? false,
      qrSlug: siteRes.data?.slug ?? null,
    },
  };
}

export type StatsEventRow = { id: string; name: string; confirmed: number; total: number };

export type StatsSummary = {
  confirmed: number;
  declined: number;
  pending: number;
  total: number;
  responseRate: number;
  events: StatsEventRow[];
};

/**
 * The stats screen's aggregates: RSVP breakdown, response rate, and one row
 * per ENABLED event. `events.enabled = false` (the seed disables "party" on
 * purpose) must drop that event from the list entirely, not show it with a
 * zero count — a disabled event is invisible to guests and excluded from
 * counts, per `WeddingEvent.enabled`'s own doc comment.
 *
 * `guest_events` has no `wedding_id` column of its own; it is reached
 * through `guests.wedding_id`, same join pattern as its RLS policy.
 *
 * The RSVP breakdown shares `dashboard_counts` with the home screen — the
 * same four numbers this screen used to fetch as four separate count
 * queries. The per-event attendance below still needs its own queries: those
 * are per-event, and the RPC deliberately returns only wedding-wide counters.
 */
export async function getStatsSummary(): Promise<StatsSummary> {
  const { supabase, weddingId } = await requireWedding();

  const [countsRes, eventsRes] = await Promise.all([
    supabase.rpc("dashboard_counts", { p_wedding_id: weddingId }),
    supabase
      .from("events")
      .select("id, name, position")
      .eq("wedding_id", weddingId)
      .eq("enabled", true)
      .order("position", { ascending: true }),
  ]);

  if (countsRes.error) throw new Error(countsRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);

  const counts = countsRes.data?.[0];
  const confirmed = counts?.guests_confirmed ?? 0;
  const declined = counts?.guests_declined ?? 0;
  const pending = counts?.guests_pending ?? 0;
  const total = counts?.guests_total ?? 0;

  // A pending guest has not answered, so only confirmed + declined count as
  // a response — matches the mock-era logic this replaces.
  const responseRate = total > 0 ? Math.round(((confirmed + declined) / total) * 100) : 0;

  const enabledEvents = eventsRes.data ?? [];

  // One `guest_events` query for every enabled event's attendance, joined to
  // `guests` for the wedding filter — a single request grouped in memory
  // rather than one round-trip per event.
  const eventRows: StatsEventRow[] = await Promise.all(
    enabledEvents.map(async (event) => {
      const { data, error } = await supabase
        .from("guest_events")
        .select("status, guests!inner(wedding_id)")
        .eq("event_id", event.id)
        .eq("guests.wedding_id", weddingId);

      if (error) throw new Error(error.message);

      const rows = data ?? [];
      return {
        id: event.id as string,
        name: event.name as string,
        confirmed: rows.filter((row) => row.status === "confirmed").length,
        total: rows.length,
      };
    }),
  );

  return {
    confirmed,
    declined,
    pending,
    total,
    responseRate,
    events: eventRows,
  };
}

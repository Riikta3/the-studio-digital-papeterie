-- Replace the broad anon reads on `events` and `day_of_settings` with RPCs.
--
-- Both policies were written as `to anon using (enabled = true)` with no
-- wedding gate:
--
--   20260902110000_events_and_guest_events.sql:48  "Guests can read enabled events"
--   20260902170000_guest_page_anon_reads.sql:49    "Guests can read enabled day_of_settings"
--
-- The comments above them describe what our own pages fetch, but a policy does
-- not restrict rows to the ones a page asks for. With the anon key — public, it
-- ships in the browser bundle — `?select=*` against PostgREST returned every
-- enabled event of every wedding: names, dates, addresses, dress codes, and an
-- enumerable list of `wedding_id`s, which is the value the RSVP area treats as
-- a secret.
--
-- Measured on a local database seeded with two weddings, before this migration:
--   GET /rest/v1/events?select=*            -> both weddings' events
--   GET /rest/v1/day_of_settings?select=wedding_id -> both wedding ids
--
-- ── A wedding-visibility gate is NOT enough ───────────────────────────────
--
-- The first version of this migration kept the policies and added
-- `wedding_is_publicly_visible(wedding_id)` to them. Re-running the two
-- requests above returned both weddings again, and rightly so: every published
-- wedding is publicly visible, so the predicate is true for all of them. It
-- gated *visibility*, never *identity*, and enumeration is precisely the act
-- of asking for rows without naming one wedding.
--
-- That is the same conclusion `20260903120000_narrow_sites_anon_read.sql`
-- reached for `sites`: "RLS cannot restrict columns, so a policy can never fix
-- this. A security-definer function can." The same holds for rows — a policy
-- filters each row on its own merits and cannot require that the caller named
-- one wedding. So the anon policies are dropped outright and replaced by RPCs
-- that take a `wedding_id` and return one wedding's rows, and cannot be asked
-- for a list.

-- ── events ────────────────────────────────────────────────────────────────

/**
 * The enabled events of ONE wedding.
 *
 * Columns match what `landing/src/actions/invitation-page-actions.ts:169` and
 * `guest-page-actions.ts:224` already select. A caller must name the wedding;
 * there is no argument that means "all of them".
 */
create or replace function public.public_wedding_events(p_wedding_id uuid)
returns table (
  id uuid,
  key text,
  name text,
  date date,
  -- `events.time` is stored as text, not as a time value.
  "time" text,
  address text,
  description text,
  dress_code text,
  -- `position` is reserved in a RETURNS TABLE column list, hence the quotes.
  "position" int
)
language sql
security definer
stable
set search_path = public
as $$
  select
    e.id, e.key, e.name, e.date, e."time",
    e.address, e.description, e.dress_code, e."position"
  from public.events e
  join public.sites s on s.wedding_id = e.wedding_id
  join public.day_of_settings ds
    on ds.wedding_id = e.wedding_id and ds.enabled = true
  where e.wedding_id = p_wedding_id
    and e.enabled = true
    and s.slug is not null
  order by e."position";
$$;

comment on function public.public_wedding_events(uuid) is
  'Enabled events of one wedding, for the anonymous guest and invitation '
  'pages. Replaces an anon policy that let `select=*` return every wedding''s '
  'events and enumerate wedding_id. Takes one wedding at a time by design.';

revoke all on function public.public_wedding_events(uuid) from public;
grant execute on function public.public_wedding_events(uuid) to anon, authenticated;

drop policy if exists "Guests can read enabled events" on public.events;

-- ── day_of_settings ───────────────────────────────────────────────────────

/**
 * The day-of switches of ONE wedding.
 *
 * Columns match `landing/src/actions/guest-page-actions.ts:124`. Returns no
 * row when the module is off, so a wedding that never enabled it stays
 * invisible rather than merely empty — the property the original policy
 * comment claimed and which is preserved here.
 */
create or replace function public.public_day_of_settings(p_wedding_id uuid)
returns table (
  enabled boolean,
  gallery_visible_to_guests boolean,
  uploads_open_until timestamptz,
  after_wedding_mode boolean,
  venue_plan_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    ds.enabled,
    ds.gallery_visible_to_guests,
    ds.uploads_open_until,
    ds.after_wedding_mode,
    ds.venue_plan_url
  from public.day_of_settings ds
  where ds.wedding_id = p_wedding_id
    and ds.enabled = true
  limit 1;
$$;

comment on function public.public_day_of_settings(uuid) is
  'Day-of switches of one wedding, for the anonymous QR page. Replaces an anon '
  'policy that made every published wedding_id enumerable.';

revoke all on function public.public_day_of_settings(uuid) from public;
grant execute on function public.public_day_of_settings(uuid) to anon, authenticated;

drop policy if exists "Guests can read enabled day_of_settings" on public.day_of_settings;

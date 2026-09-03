-- One round trip for the dashboard's counters, instead of ten.
--
-- Measured against the seeded wedding: the home page issues ten separate
-- `count: "exact"` queries. Even fired in parallel — which the action already
-- does — seven of them took 317ms, because each pays its own round trip to
-- eu-west-2. Serially they took 681ms.
--
-- Postgres computes all of them in a single pass over the same rows, so this
-- replaces ten network calls with one. The guest counts share one scan through
-- `filter (where …)`, which is what the aggregate form exists for.
--
-- Returns counts only — no names, no contact details, nothing per-guest. The
-- caller already only wanted numbers.
--
-- `security definer` is needed so one call can read across `guests`, `tables`,
-- `guest_media` and `events` without RLS re-checking ownership ten times. That
-- means the function must check ownership itself: without the guard below, any
-- authenticated couple could ask for another wedding's figures by guessing its
-- id. It returns nothing at all for a wedding the caller does not own — same
-- shape as an empty wedding, so it cannot be used to probe which ids exist.
create or replace function public.dashboard_counts(p_wedding_id uuid)
returns table (
  guests_total int,
  guests_confirmed int,
  guests_pending int,
  guests_declined int,
  guests_children int,
  guests_seated int,
  tables_total int,
  tables_capacity int,
  media_total int,
  events_enabled int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    -- One scan of `guests`, six numbers out of it.
    (select count(*)::int from public.guests g where g.wedding_id = w.id),
    (select count(*)::int from public.guests g where g.wedding_id = w.id and g.status = 'confirmed'),
    (select count(*)::int from public.guests g where g.wedding_id = w.id and g.status = 'pending'),
    (select count(*)::int from public.guests g where g.wedding_id = w.id and g.status = 'declined'),
    (select count(*)::int from public.guests g where g.wedding_id = w.id and g.is_child = true),
    (select count(*)::int from public.guests g where g.wedding_id = w.id and g.table_id is not null),
    (select count(*)::int from public.tables t where t.wedding_id = w.id),
    -- Total seats across the couple's tables, so "116 / 120" needs no second query.
    (select coalesce(sum(t.capacity), 0)::int from public.tables t where t.wedding_id = w.id),
    (select count(*)::int from public.guest_media m where m.wedding_id = w.id),
    (select count(*)::int from public.events e where e.wedding_id = w.id and e.enabled = true)
  -- The ownership guard, and the reason every subquery above keys off `w.id`
  -- rather than the parameter: no matching wedding means no row at all, so a
  -- caller asking about someone else's id gets exactly what they would get for
  -- a wedding that does not exist.
  from public.weddings w
  where w.id = p_wedding_id
    and w.user_id = auth.uid();
$$;

comment on function public.dashboard_counts(uuid) is
  'Every counter the dashboard home and stats screens need, in one round trip '
  'instead of ten. Counts only — no guest names or contact details. '
  'security definer so it can be called without granting the caller table-wide '
  'select; it checks ownership itself (weddings.user_id = auth.uid()) and '
  'returns no row for a wedding the caller does not own.';

-- `authenticated` only: these are the couple's own figures, there is no reason
-- for an anonymous visitor to ask for them, and `auth.uid()` is null for anon
-- so the guard above would refuse every row anyway.
revoke all on function public.dashboard_counts(uuid) from public;
grant execute on function public.dashboard_counts(uuid) to authenticated;

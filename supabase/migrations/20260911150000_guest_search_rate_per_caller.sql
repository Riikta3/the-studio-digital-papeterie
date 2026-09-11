-- Make the seating-search rate limit per caller instead of per wedding.
--
-- `20260903110000_guest_search_rate_limit.sql` counts every call to
-- `search_guest_table` against one window per wedding: 30 searches per 10
-- minutes, shared by everybody. It says so plainly — "the window is therefore
-- per-wedding, which is the unit that actually needs protecting" — and for
-- stopping enumeration that reasoning holds.
--
-- It has a cost that was not weighed: 30 requests from one source shut the
-- "Ma table" search for every real guest of that wedding for ten minutes. On
-- the evening it matters, a single script — or one guest with a flaky
-- connection retrying — locks out the room. Refusing silently (the function
-- returns no rows rather than raising) makes it look like the guest is simply
-- not on the list.
--
-- The caller bucket introduced for the RSVP RPCs in 20260911100000 solves it
-- the same way here: the action derives an opaque value from the request and
-- hashes it before sending, so Postgres stores a digest and never an address.
-- It is not a boundary on its own — an attacker rotates it — which is why the
-- column whitelist, the 5-row cap and the 2-character minimum still do the
-- real work. What it buys is that one abuser no longer speaks for the room.
--
-- A per-wedding ceiling is kept on top, high enough that no plausible number
-- of real guests reaches it, so rotating buckets still runs into a wall.

-- The two-argument versions are dropped first: adding a defaulted third
-- parameter creates an overload rather than replacing them, and a call with
-- two arguments would then be ambiguous and fail at runtime.
drop function if exists public.search_guest_table(uuid, text);
drop function if exists public.check_guest_search_rate(uuid);

alter table public.guest_search_attempts
  add column if not exists caller_bucket text;

comment on column public.guest_search_attempts.caller_bucket is
  'sha256 hex of a per-request value supplied by the caller, so one source '
  'cannot exhaust the window for a whole wedding. Null for rows written '
  'before 20260911150000.';

create index if not exists idx_guest_search_attempts_caller
  on public.guest_search_attempts(wedding_id, caller_bucket, searched_at desc);

/**
 * Two windows, both of which must allow the call.
 *
 * Per caller: 30 per 10 minutes — a guest types a few letters, finds their
 * table and stops, so a whole family sharing a phone stays far under it.
 *
 * Per wedding: 600 per 10 minutes. Above any real room (a 300-guest wedding
 * searching twice each, all within the same ten minutes) and far below what
 * enumeration needs, so rotating buckets is still bounded.
 */
create or replace function public.check_guest_search_rate(
  p_wedding_id uuid,
  p_bucket text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent_caller int;
  v_recent_wedding int;
  v_bucket text := coalesce(nullif(trim(p_bucket), ''), 'unknown');
begin
  select count(*) into v_recent_caller
  from public.guest_search_attempts
  where wedding_id = p_wedding_id
    and caller_bucket = v_bucket
    and searched_at > now() - interval '10 minutes';

  if v_recent_caller >= 30 then
    return false;
  end if;

  select count(*) into v_recent_wedding
  from public.guest_search_attempts
  where wedding_id = p_wedding_id
    and searched_at > now() - interval '10 minutes';

  if v_recent_wedding >= 600 then
    return false;
  end if;

  insert into public.guest_search_attempts (wedding_id, caller_bucket)
  values (p_wedding_id, v_bucket);

  -- Opportunistic cleanup, as before: roughly one call in twenty drops rows
  -- older than the window, so the table cannot grow without bound.
  if random() < 0.05 then
    delete from public.guest_search_attempts
    where searched_at < now() - interval '1 hour';
  end if;

  return true;
end;
$$;

revoke all on function public.check_guest_search_rate(uuid, text) from public;

/**
 * `search_guest_table`, taking the caller bucket through to the rate check.
 *
 * Everything else is unchanged from 20260903110000 — same 2-character
 * minimum, same accent folding, same confirmed+seated filter, same four
 * columns, same `limit 5`. Do not relax any of them without re-reading
 * cahier §16.
 *
 * One defect of that version is fixed here: `p_query` was interpolated into
 * `like` without escaping, so a single `%` matched every guest and walked
 * straight past the 2-character minimum. The wildcards are escaped now.
 */
create or replace function public.search_guest_table(
  p_wedding_id uuid,
  p_query text,
  p_bucket text default null
)
returns table (
  first_name text,
  last_name text,
  table_name text,
  seats_label text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_query text;
begin
  if p_wedding_id is null or length(trim(p_query)) < 2 then
    return;
  end if;

  if not public.check_guest_search_rate(p_wedding_id, p_bucket) then
    return;
  end if;

  v_query := translate(
    lower(trim(p_query)),
    'àâäéèêëïîôöùûüçñÀÂÄÉÈÊËÏÎÔÖÙÛÜÇÑ',
    'aaaeeeeiioouuucnAAAEEEEIIOOUUUCN'
  );

  -- Escape LIKE wildcards after folding, before interpolating.
  v_query := replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_');

  return query
  select
    g.first_name,
    g.last_name,
    t.name as table_name,
    t.seats_label
  from public.guests g
  join public.tables t on t.id = g.table_id
  where g.wedding_id = p_wedding_id
    and g.status = 'confirmed'
    and g.table_id is not null
    and (
      translate(lower(g.first_name), 'àâäéèêëïîôöùûüçñÀÂÄÉÈÊËÏÎÔÖÙÛÜÇÑ', 'aaaeeeeiioouuucnAAAEEEEIIOOUUUCN') like '%' || v_query || '%' escape '\'
      or translate(lower(g.last_name), 'àâäéèêëïîôöùûüçñÀÂÄÉÈÊËÏÎÔÖÙÛÜÇÑ', 'aaaeeeeiioouuucnAAAEEEEIIOOUUUCN') like '%' || v_query || '%' escape '\'
    )
  order by g.last_name, g.first_name
  limit 5;
end;
$$;

comment on function public.search_guest_table(uuid, text, text) is
  'Security-definer RPC backing the Jour J "Ma table" search. Confirmed and '
  'seated guests only, a 2-character minimum with LIKE wildcards escaped, a '
  '5-row cap, four columns (no contact info, no status, no id), and since '
  '20260911150000 a rate limit counted per caller as well as per wedding, so '
  'one abuser can no longer close the search for a whole room. Do not relax '
  'any of these without re-reading cahier des charges §16.';

grant execute on function public.search_guest_table(uuid, text, text) to anon, authenticated;

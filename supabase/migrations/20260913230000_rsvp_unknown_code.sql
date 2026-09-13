-- Migration: an unknown wedding code must say "unknown", not crash.
--
-- `resolve_wedding_code` counts failed lookups so the code cannot be brute
-- forced. With no wedding to attribute the failure to, it logged the attempt
-- against a sentinel id of all zeroes — a row that does not exist in
-- `weddings`, and `rsvp_attempts.wedding_id` is a NOT NULL foreign key onto
-- it. So every wrong code raised:
--
--   insert or update on table "rsvp_attempts" violates foreign key
--   constraint "rsvp_attempts_wedding_id_fkey"
--
-- A guest who mistyped their code got a database error instead of "code
-- incorrect", and the RSVP entry screen was unusable for them. The happy path
-- never touched this branch, which is why it survived: only a WRONG code hit
-- it.
--
-- The fix is to let the column say "no wedding": `wedding_id` becomes
-- nullable, and a failed lookup is recorded as a null. Nothing else writes a
-- null, so the rate limiter keeps counting per wedding as before, with one
-- extra bucket for lookups that matched nothing.
--
-- `check_rsvp_rate` has to compare with `is not distinct from` rather than
-- `=`: in SQL `null = null` is null, never true, so the count would silently
-- return zero for the failure bucket and the limit would never be reached —
-- brute force free again, which is the very thing this guards.

alter table public.rsvp_attempts
  alter column wedding_id drop not null;

comment on column public.rsvp_attempts.wedding_id is
  'The wedding the attempt was aimed at, or null when the code matched no '
  'wedding at all. Null is its own rate-limiting bucket: without it a failed '
  'lookup has nothing to be attributed to, and guessing would be unmetered.';

-- Recreated only to swap `=` for `is not distinct from`, so the null bucket
-- counts. Everything else is unchanged.
create or replace function public.check_rsvp_rate(
  p_wedding_id uuid,
  p_bucket text,
  p_kind text,
  p_limit int,
  p_window interval
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent int;
begin
  select count(*) into v_recent
  from public.rsvp_attempts
  where wedding_id is not distinct from p_wedding_id
    and caller_bucket = p_bucket
    and kind = p_kind
    and attempted_at > now() - p_window;

  if v_recent >= p_limit then
    return false;
  end if;

  insert into public.rsvp_attempts (wedding_id, caller_bucket, kind)
  values (p_wedding_id, p_bucket, p_kind);

  -- Opportunistic cleanup on roughly one call in twenty, so the table cannot
  -- grow without bound and no cron job is needed.
  if random() < 0.05 then
    delete from public.rsvp_attempts
    where attempted_at < now() - interval '1 day';
  end if;

  return true;
end;
$$;

revoke all on function public.check_rsvp_rate(uuid, text, text, int, interval) from public;

-- Recreated only to pass null instead of the sentinel id.
create or replace function public.resolve_wedding_code(
  p_code text,
  p_bucket text
)
returns table (
  wedding_id uuid,
  couple_names text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wedding_id uuid;
begin
  if p_code is null or length(trim(p_code)) < 4 then
    return;
  end if;

  select s.wedding_id into v_wedding_id
  from public.settings s
  where upper(trim(s.wedding_code)) = upper(trim(p_code))
  limit 1;

  if v_wedding_id is null then
    -- Count failures too, otherwise brute force is free. Null, not a sentinel
    -- id: there is no wedding here, and `rsvp_attempts` has a foreign key
    -- that an invented id cannot satisfy.
    perform public.check_rsvp_rate(
      null::uuid, p_bucket, 'search', 20, interval '10 minutes'
    );
    return;
  end if;

  if not public.check_rsvp_rate(v_wedding_id, p_bucket, 'search', 20, interval '10 minutes') then
    return;
  end if;

  return query
  select
    v_wedding_id,
    concat_ws(' & ', nullif(p.first_name, ''), nullif(p.partner_name, ''))
  from public.weddings w
  join public.profiles p on p.id = w.user_id
  where w.id = v_wedding_id;
end;
$$;

comment on function public.resolve_wedding_code(text, text) is
  'Security-definer RPC turning a wedding code into a wedding id and the '
  'couple''s display names, for the public RSVP entry screen. Returns nothing '
  'else about the settings row, and rate-limits failures so the code cannot be '
  'brute forced. An unknown code returns no rows — never an error.';

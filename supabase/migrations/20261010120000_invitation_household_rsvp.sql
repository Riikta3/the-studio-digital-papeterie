-- The invitation's RSVP answers for a household of the couple's guest list.
--
-- Until now the RSVP form of a theme wrote a free-standing row into
-- `rsvp_responses`, with no link to `households`/`guests`. A couple who built
-- their list in the dashboard saw nothing change on it when a guest answered:
-- they had to copy every answer across by hand.
--
-- The invitation link stays the same for everyone (no per-guest query string,
-- which couples do not want on their own domain). The guest identifies
-- themselves by typing their name in the RSVP form:
--
--   1. `find_invitation_household` looks the name up in the couple's list. The
--      match is on the WHOLE name of one guest (first + last, either order,
--      case and common accents ignored), never on a fragment: typing "Mar"
--      returns nothing, so the list cannot be browsed from the invitation.
--   2. If exactly one household holds that name, its members come back (first
--      name, last name, child flag, current status — nothing else) and the form
--      asks for an answer for each of them.
--   3. `submit_invitation_household_rsvp` writes those answers onto `guests`,
--      derives the household status from them, and keeps ONE `rsvp_responses`
--      row per household up to date, so the "Réponses RSVP" screen, the
--      messages screen and the business report keep working unchanged.
--
-- A name that matches nobody (or two households) falls back to the existing
-- free-form answer, which lands in `rsvp_responses` with `household_id` null:
-- the dashboard shows those as "à rattacher".
--
-- Same shape as 20260911100000_rsvp_public_rpcs.sql: security-definer RPCs are
-- the only path to guest data, with the column whitelist, the row cap and the
-- rate limit inside the database.

-- ── Link an answer to its household ───────────────────────────────────────

alter table public.rsvp_responses
  add column if not exists household_id uuid
    references public.households(id) on delete set null;

comment on column public.rsvp_responses.household_id is
  'The household of the guest list this answer belongs to. Set when the guest '
  'was recognised by name on the invitation, or when the couple attached the '
  'answer by hand. Null = an answer still to attach ("à rattacher").';

-- One live answer per household: a second member answering updates the row
-- rather than adding one, so the per-response counts on the RSVP screen never
-- count a household twice.
create unique index if not exists rsvp_responses_household_unique
  on public.rsvp_responses(household_id)
  where household_id is not null;

-- ── Name normalisation ────────────────────────────────────────────────────
--
-- Lowercase, the accents that occur in French names stripped (no `unaccent`
-- extension in this project — see 20260902130000_guest_table_search.sql),
-- hyphens and apostrophes read as spaces, whitespace collapsed. "Jean-Éric
-- D'Almeida" and "jean eric d almeida" are the same key.

create or replace function public.rsvp_name_key(p_value text)
returns text
language sql
immutable
set search_path = public
as $$
  select trim(regexp_replace(
    translate(
      lower(coalesce(p_value, '')),
      'àáâãäåæçèéêëìíîïñòóôõöøœùúûüýÿ',
      'aaaaaaaceeeeiiiinooooooouuuuyy'
    ),
    '[\s''’.-]+', ' ', 'g'
  ));
$$;

comment on function public.rsvp_name_key(text) is
  'Normalised form of a name for the invitation RSVP lookup: lowercase, '
  'common accents stripped, hyphens/apostrophes/dots as spaces, whitespace '
  'collapsed.';

-- ── Household status from its members ─────────────────────────────────────
--
-- All confirmed → confirmed; all declined → declined; some confirmed and some
-- not → partial; nobody confirmed and someone still undecided → pending.
-- Replaces the hard-coded 'confirmed' of `submit_rsvp_household`, which marked
-- a household as coming even when every member had declined.

create or replace function public.household_status_from_guests(p_household_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select case
    when count(*) = 0 then null
    when count(*) filter (where status = 'confirmed') = count(*) then 'confirmed'
    when count(*) filter (where status = 'declined') = count(*) then 'declined'
    when count(*) filter (where status = 'confirmed') > 0 then 'partial'
    else 'pending'
  end
  from public.guests
  where household_id = p_household_id;
$$;

revoke all on function public.household_status_from_guests(uuid) from public;

-- ── 1. Find a household by a guest's full name ────────────────────────────

create or replace function public.find_invitation_household(
  p_wedding_id uuid,
  p_full_name text,
  p_bucket text
)
returns table (
  household_id uuid,
  household_name text,
  answered_at timestamptz,
  members jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := public.rsvp_name_key(p_full_name);
  v_households uuid[];
begin
  -- A full name has at least two words; one word would match every "Martin".
  if p_wedding_id is null or v_key not like '% %' or length(v_key) > 160 then
    return;
  end if;

  if not public.check_rsvp_rate(p_wedding_id, p_bucket, 'search', 20, interval '10 minutes') then
    return;
  end if;

  select array_agg(distinct g.household_id) into v_households
  from public.guests g
  where g.wedding_id = p_wedding_id
    and g.household_id is not null
    and (
      public.rsvp_name_key(g.first_name || ' ' || g.last_name) = v_key
      or public.rsvp_name_key(g.last_name || ' ' || g.first_name) = v_key
    );

  -- Nobody, or two households sharing the name: the guest answers with the
  -- free form and the couple attaches it. Guessing would let one homonym
  -- answer for another family.
  if coalesce(array_length(v_households, 1), 0) <> 1 then
    return;
  end if;

  return query
  select
    h.id,
    h.name,
    (select r.submitted_at from public.rsvp_responses r where r.household_id = h.id),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', g.id,
            'first_name', g.first_name,
            'last_name', g.last_name,
            'is_child', coalesce(g.is_child, false),
            'status', g.status
          )
          order by coalesce(g.is_child, false), g.created_at, g.first_name
        )
        from public.guests g
        where g.household_id = h.id
      ),
      '[]'::jsonb
    )
  from public.households h
  where h.id = v_households[1]
    and h.wedding_id = p_wedding_id;
end;
$$;

comment on function public.find_invitation_household(uuid, text, text) is
  'Security-definer RPC behind the invitation RSVP: returns the household of '
  'the guest whose WHOLE name matches (never a fragment), with its members'' '
  'names, child flag and status only. Nothing when no household or several '
  'match. Rate-limited. Do not widen the column list.';

-- ── 2. Record the household's answers ─────────────────────────────────────
--
-- `p_answers` is `[{id, status}]` with status in confirmed/declined/pending,
-- one entry for EVERY member of the household: an answer that leaves someone
-- out is refused, which is the "nobody forgotten" rule the form enforces.
--
-- `p_full_name` must still match a member of the household: the caller proves
-- they went through the lookup, and a household id alone (which is not secret
-- once seen) is not enough to answer for a family.

create or replace function public.submit_invitation_household_rsvp(
  p_wedding_id uuid,
  p_household_id uuid,
  p_full_name text,
  p_answers jsonb,
  p_dietary text,
  p_message text,
  p_bucket text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := public.rsvp_name_key(p_full_name);
  v_household_name text;
  v_members int;
  v_answered int;
  v_respondent uuid;
  v_status text;
  v_lead record;
  v_participants jsonb;
  v_attendance boolean;
  v_dietary text := nullif(left(trim(coalesce(p_dietary, '')), 200), '');
  v_message text := nullif(left(trim(coalesce(p_message, '')), 1000), '');
begin
  if p_wedding_id is null or p_household_id is null or jsonb_typeof(p_answers) <> 'array' then
    return false;
  end if;

  select h.name into v_household_name
  from public.households h
  where h.id = p_household_id and h.wedding_id = p_wedding_id;

  if v_household_name is null then
    return false;
  end if;

  select g.id into v_respondent
  from public.guests g
  where g.household_id = p_household_id
    and (
      public.rsvp_name_key(g.first_name || ' ' || g.last_name) = v_key
      or public.rsvp_name_key(g.last_name || ' ' || g.first_name) = v_key
    )
  limit 1;

  if v_respondent is null then
    return false;
  end if;

  if not public.check_rsvp_rate(p_wedding_id, p_bucket, 'write', 20, interval '10 minutes') then
    return false;
  end if;

  -- Every member, exactly once, with a valid status.
  select count(*) into v_members
  from public.guests where household_id = p_household_id;

  select count(distinct g.id) into v_answered
  from jsonb_array_elements(p_answers) a
  join public.guests g
    on g.id::text = a->>'id'
   and g.household_id = p_household_id
  where a->>'status' in ('confirmed', 'declined', 'pending');

  if v_members = 0 or v_answered <> v_members then
    return false;
  end if;

  update public.guests g
  set status = a->>'status'
  from jsonb_array_elements(p_answers) a
  where g.id::text = a->>'id'
    and g.household_id = p_household_id
    and g.wedding_id = p_wedding_id
    and a->>'status' in ('confirmed', 'declined', 'pending');

  -- The form asks one diet for the whole answer; it belongs to whoever typed it.
  if v_dietary is not null then
    update public.guests set dietary_requirements = v_dietary where id = v_respondent;
  end if;

  v_status := public.household_status_from_guests(p_household_id);

  update public.households
  set
    status = coalesce(v_status, status),
    message_to_couple = coalesce(v_message, message_to_couple)
  where id = p_household_id;

  -- Mirror into `rsvp_responses`, one row per household. Its readers count
  -- "1 respondent + participants" for an answer that is coming, so the lead is
  -- the respondent when they come, otherwise the first member who does; the
  -- participants are the other members who come.
  select g.id, g.first_name, g.last_name into v_lead
  from public.guests g
  where g.household_id = p_household_id and g.status = 'confirmed'
  order by (g.id = v_respondent) desc, coalesce(g.is_child, false), g.created_at
  limit 1;

  if v_lead.id is null then
    select g.id, g.first_name, g.last_name into v_lead
    from public.guests g where g.id = v_respondent;
  end if;

  select coalesce(jsonb_agg(
    jsonb_strip_nulls(jsonb_build_object(
      'first_name', g.first_name,
      'last_name', g.last_name,
      'relation_type', case when g.is_child then 'child' end
    ))
    order by coalesce(g.is_child, false), g.created_at
  ), '[]'::jsonb) into v_participants
  from public.guests g
  where g.household_id = p_household_id
    and g.status = 'confirmed'
    and g.id <> v_lead.id;

  v_attendance := case v_status
    when 'confirmed' then true
    when 'partial' then true
    when 'declined' then false
    else null
  end;

  insert into public.rsvp_responses (
    wedding_id, household_id, name, respondent_first_name, respondent_last_name,
    attendance, guest_count, participants, dietary, message
  )
  values (
    p_wedding_id, p_household_id, v_household_name, v_lead.first_name, v_lead.last_name,
    v_attendance, jsonb_array_length(v_participants), v_participants, v_dietary, v_message
  )
  on conflict (household_id) where household_id is not null do update
  set
    name = excluded.name,
    respondent_first_name = excluded.respondent_first_name,
    respondent_last_name = excluded.respondent_last_name,
    attendance = excluded.attendance,
    guest_count = excluded.guest_count,
    participants = excluded.participants,
    dietary = coalesce(excluded.dietary, rsvp_responses.dietary),
    message = coalesce(excluded.message, rsvp_responses.message),
    submitted_at = timezone('utc'::text, now());

  return true;
end;
$$;

comment on function public.submit_invitation_household_rsvp(uuid, uuid, text, jsonb, text, text, text) is
  'Security-definer RPC recording a household''s RSVP from the invitation. '
  'Requires the typed name to match a member, an answer for every member, '
  'derives the household status, and keeps one rsvp_responses row per '
  'household. Rate-limited.';

grant execute on function public.find_invitation_household(uuid, text, text) to anon, authenticated;
grant execute on function public.submit_invitation_household_rsvp(uuid, uuid, text, jsonb, text, text, text) to anon, authenticated;

-- ── 3. The dashboard's /rsvp page: derive the status, do not assume it ─────
--
-- Recreated from 20260911100000_rsvp_public_rpcs.sql with one change: the
-- household status is computed from its members after they are written,
-- instead of being set to 'confirmed' whatever they answered.

create or replace function public.submit_rsvp_household(
  p_wedding_id uuid,
  p_household_id uuid,
  p_email text,
  p_song text,
  p_transport text,
  p_message text,
  p_guests jsonb,
  p_bucket text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_guest jsonb;
begin
  select exists (
    select 1 from public.households
    where id = p_household_id and wedding_id = p_wedding_id
  ) into v_exists;

  if not v_exists then
    return false;
  end if;

  if not public.check_rsvp_rate(p_wedding_id, p_bucket, 'write', 20, interval '10 minutes') then
    return false;
  end if;

  update public.households
  set
    email = coalesce(nullif(trim(p_email), ''), email),
    song_request = left(p_song, 500),
    transportation = left(p_transport, 500),
    message_to_couple = left(p_message, 2000)
  where id = p_household_id
    and wedding_id = p_wedding_id;

  for v_guest in select * from jsonb_array_elements(coalesce(p_guests, '[]'::jsonb))
  loop
    update public.guests
    set
      status = case
        when v_guest->>'status' in ('pending', 'confirmed', 'declined')
          then v_guest->>'status'
        else status
      end,
      dietary_requirements = left(v_guest->>'dietary_requirements', 500)
    where id = (v_guest->>'id')::uuid
      and household_id = p_household_id
      and wedding_id = p_wedding_id;
  end loop;

  update public.households
  set status = coalesce(public.household_status_from_guests(p_household_id), status)
  where id = p_household_id;

  return true;
end;
$$;

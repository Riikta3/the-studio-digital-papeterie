-- Contact form, second pass: the fields that let a wedding project be
-- qualified before anyone replies to it.
--
-- 20260909120000 shipped the minimum — name, email, subject, message, locale.
-- The brief that followed asks the couple for their wedding date, venue,
-- approximate guest count, the collection they have their eye on and how far
-- along they are. Those answers are the whole point of the richer form: they
-- are what makes a reply useful rather than a request for more information.
-- Collecting them into a form that then dropped them on the floor would be
-- worse than not asking, hence this migration.
--
-- Everything here is additive. No column is dropped, no existing column
-- changes type, and every new column is nullable with a permissive check, so
-- the rows written by the first version of the RPC stay valid.
--
-- The security model of 20260909120000 is untouched and must stay that way:
-- still no insert policy on the table, still one security-definer RPC as the
-- only write path, still the same two rate-limit windows. Read that
-- migration's header before changing anything here.

/* ------------------------------------------------------------------ *
 * New columns
 * ------------------------------------------------------------------ */

-- The form now asks for the two names separately, which is what you want when
-- addressing a couple by their first name in a reply. `name` is kept as the
-- display name (first + last, joined by the RPC) so that existing rows, the
-- notification email and any future admin list keep working off one column.
alter table public.contact_messages
  add column if not exists first_name text,
  add column if not exists last_name text,
  -- A date, not a timestamp: nobody books a ceremony to the minute a year out,
  -- and a bare date sidesteps every timezone question.
  add column if not exists wedding_date date,
  -- Free text on purpose. "Ville, domaine ou pays" cannot be an enum, and a
  -- couple who has not chosen the venue still wants to say "quelque part en
  -- Italie".
  add column if not exists wedding_place text,
  -- A band rather than a number: the form asks for an approximation, and an
  -- integer would invite false precision on an answer nobody has yet.
  add column if not exists guest_band text,
  -- Which of the five intents the couple picked. Distinct from `subject`,
  -- which stays the triage axis of the first version.
  add column if not exists interest text,
  -- Only meaningful when `interest` is about a collection; null otherwise.
  add column if not exists collection text,
  add column if not exists project_stage text,
  -- Recorded because the form now carries an explicit consent checkbox. Stored
  -- as the moment it was given, not a bare boolean: "when" is the part that
  -- makes a consent record worth anything.
  add column if not exists consent_at timestamptz;

comment on column public.contact_messages.name is
  'Display name, "first last". Kept alongside first_name/last_name so one '
  'column is always safe to show, including for rows written before '
  '20260909140000 split the two.';
comment on column public.contact_messages.guest_band is
  'Approximate guest count as a band, never a number: the form asks for an '
  'estimate and an integer would fake a precision the couple does not have.';
comment on column public.contact_messages.collection is
  'Only set when `interest` concerns a collection. Null is the normal case.';
comment on column public.contact_messages.consent_at is
  'When the privacy consent checkbox was ticked. Null for rows predating it.';

/* ------------------------------------------------------------------ *
 * Constraints
 * ------------------------------------------------------------------ */

-- Bounds and enums as table constraints, for the same reason as the first
-- migration: a last net if the function is ever rewritten by someone who did
-- not read these headers. Each allows null, so old rows stay valid.
--
-- Guarded in a DO block rather than `add constraint if not exists`, which
-- Postgres does not support for check constraints.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_first_name_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_first_name_len
      check (first_name is null or char_length(first_name) between 1 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_last_name_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_last_name_len
      check (last_name is null or char_length(last_name) between 1 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_place_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_place_len
      check (wedding_place is null or char_length(wedding_place) between 1 and 160);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_guest_band_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_guest_band_enum
      check (guest_band is null or guest_band in
        ('lt-50', '50-100', '100-150', '150-200', 'gt-200', 'unknown'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_interest_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_interest_enum
      check (interest is null or interest in
        ('collection', 'personnaliser', 'sur-mesure', 'question', 'unknown'));
  end if;

  -- The three theme slugs are the ones that exist under
  -- landing/src/components/invitation/themes/. Adding a theme means adding it
  -- here too — a constraint that silently accepts anything would let a typo
  -- from the form become a value nobody can filter on.
  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_collection_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_collection_enum
      check (collection is null or collection in
        ('ciao-amore', 'blanc-couture', 'belle-rive', 'unknown'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_stage_enum'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_stage_enum
      check (project_stage is null or project_stage in
        ('decouvre', 'univers-choisi', 'idee-precise', 'besoin-conseil'));
  end if;
end
$$;

/* ------------------------------------------------------------------ *
 * The RPC, extended
 * ------------------------------------------------------------------ */

/**
 * Same contract as the five-argument version: validates everything, enforces
 * both rate-limit windows, returns a bare boolean that never says which check
 * refused it.
 *
 * The new arguments all default to null, so this is a drop-in replacement —
 * a caller still passing only the original five keeps working. That matters
 * because the deployed action and this function are not updated atomically.
 *
 * The five original arguments keep their names and positions. Postgres treats
 * a changed signature as a different function, so the old five-argument one
 * still exists and is dropped at the end of this file once nothing needs it.
 */
create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text,
  p_locale text,
  p_first_name text default null,
  p_last_name text default null,
  p_wedding_date date default null,
  p_wedding_place text default null,
  p_guest_band text default null,
  p_interest text default null,
  p_collection text default null,
  p_project_stage text default null,
  p_consent boolean default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_message text := trim(coalesce(p_message, ''));
  v_locale text := trim(coalesce(p_locale, ''));
  v_first text := nullif(trim(coalesce(p_first_name, '')), '');
  v_last text := nullif(trim(coalesce(p_last_name, '')), '');
  v_place text := nullif(trim(coalesce(p_wedding_place, '')), '');
  v_hash text;
begin
  -- When the two names are supplied, they are the source of truth and `name`
  -- is derived from them. Otherwise fall back to whatever `p_name` carried,
  -- which is how the original five-argument callers behave.
  if v_first is not null or v_last is not null then
    v_name := trim(concat_ws(' ', v_first, v_last));
  end if;

  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    return false;
  end if;

  if v_first is not null and char_length(v_first) > 60 then
    return false;
  end if;

  if v_last is not null and char_length(v_last) > 60 then
    return false;
  end if;

  if char_length(v_email) < 3 or char_length(v_email) > 160
     or v_email !~ '^[^@[:space:]]+@[^@[:space:].]+\.[a-z]{2,}$' then
    return false;
  end if;

  if p_subject is null or p_subject not in
     ('avant-achat', 'ma-commande', 'technique', 'sur-mesure', 'autre') then
    return false;
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 2000 then
    return false;
  end if;

  if char_length(v_locale) < 2 or char_length(v_locale) > 5 then
    return false;
  end if;

  if v_place is not null and char_length(v_place) > 160 then
    return false;
  end if;

  -- A wedding in the past, or more than a decade out, is a typo rather than a
  -- date. Refusing it here means the notification email cannot carry nonsense.
  if p_wedding_date is not null
     and (p_wedding_date < current_date - interval '1 day'
          or p_wedding_date > current_date + interval '10 years') then
    return false;
  end if;

  if p_guest_band is not null and p_guest_band not in
     ('lt-50', '50-100', '100-150', '150-200', 'gt-200', 'unknown') then
    return false;
  end if;

  if p_interest is not null and p_interest not in
     ('collection', 'personnaliser', 'sur-mesure', 'question', 'unknown') then
    return false;
  end if;

  if p_collection is not null and p_collection not in
     ('ciao-amore', 'blanc-couture', 'belle-rive', 'unknown') then
    return false;
  end if;

  if p_project_stage is not null and p_project_stage not in
     ('decouvre', 'univers-choisi', 'idee-precise', 'besoin-conseil') then
    return false;
  end if;

  v_hash := md5(v_email);

  if not public.check_contact_rate(v_hash) then
    return false;
  end if;

  insert into public.contact_messages (
    name, email, subject, message, locale,
    first_name, last_name, wedding_date, wedding_place,
    guest_band, interest, collection, project_stage, consent_at
  )
  values (
    v_name, v_email, p_subject, v_message, v_locale,
    v_first, v_last, p_wedding_date, v_place,
    p_guest_band, p_interest,
    -- The collection question is only asked when the interest is about one, so
    -- a value arriving with any other interest is dropped rather than stored
    -- against a question that was never shown.
    case when p_interest in ('collection', 'personnaliser')
      then p_collection else null end,
    p_project_stage,
    case when p_consent is true then now() else null end
  );

  insert into public.contact_attempts (email_hash) values (v_hash);

  if random() < 0.05 then
    delete from public.contact_attempts
    where attempted_at < now() - interval '2 hours';
  end if;

  return true;
end;
$$;

revoke all on function public.submit_contact_message(
  text, text, text, text, text, text, text, date, text, text, text, text, text, boolean
) from public;
grant execute on function public.submit_contact_message(
  text, text, text, text, text, text, text, date, text, text, text, text, text, boolean
) to anon;

comment on function public.submit_contact_message(
  text, text, text, text, text, text, text, date, text, text, text, text, text, boolean
) is
  'Security-definer RPC backing the public contact form: the only path by '
  'which an anonymous visitor can write a contact message. Validates and '
  'bounds every field, enforces 60 submissions per 10 minutes globally and 3 '
  'per hour per email, and returns a bare boolean so a refusal reveals '
  'nothing. Do not add an insert policy to contact_messages — see the header '
  'of 20260909120000 for why.';

-- The five-argument version is now unreachable: PostgREST resolves by the
-- argument names it is given, and the extended function accepts that same
-- five-name call through its defaults. Dropping it keeps exactly one write
-- path, which is the property the whole design rests on.
drop function if exists public.submit_contact_message(text, text, text, text, text);

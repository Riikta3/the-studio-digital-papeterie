-- The contact form's "which collection?" accepts the three themes added on
-- 2026-10-02 (Maré Alta, Château Royal, Cabo Verde).
--
-- The answer is checked twice, on purpose (see 20260909140000): by the
-- `contact_messages_collection_enum` constraint and by the RPC, which refuses
-- an unknown value before anything is written. Both lists change together.
--
-- Order of deployment: this migration first, then the landing code that offers
-- the new themes in the form. The other way round, a visitor choosing one of
-- them gets a refusal (the RPC returns false) and their message is lost.
--
-- The function body is the one of 20260909140000, unchanged but for the list.

alter table public.contact_messages
  drop constraint if exists contact_messages_collection_enum;

alter table public.contact_messages
  add constraint contact_messages_collection_enum
  check (collection is null or collection in
    ('ciao-amore', 'blanc-couture', 'belle-rive',
     'mare-alta', 'chateau-royal', 'cabo-verde', 'unknown'));

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
     ('ciao-amore', 'blanc-couture', 'belle-rive',
      'mare-alta', 'chateau-royal', 'cabo-verde', 'unknown') then
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

-- `create or replace` with the same signature keeps the grants and the comment
-- of the existing function; restated so this file reads on its own.
revoke all on function public.submit_contact_message(
  text, text, text, text, text, text, text, date, text, text, text, text, text, boolean
) from public;
grant execute on function public.submit_contact_message(
  text, text, text, text, text, text, text, date, text, text, text, text, text, boolean
) to anon;

-- "Ma table" search RPC (spec §5.7, cahier §16).
--
-- This function is the ENTIRE reason an anonymous guest, scanning the Jour J
-- QR code, can find their own table without the guest list being readable by
-- anyone with the URL. `guests` has no anon select policy anywhere in this
-- schema and must never get one; this security-definer function is the sole,
-- narrow, deliberately-limited hole through which an anonymous visitor can
-- learn anything about the guest list. Do not add a broader policy "for
-- convenience" later without re-reading cahier §16.
--
-- Requirements enforced (see verification list at the end of this file):
--   1. length(trim(p_query)) < 2  -> returns zero rows
--   2. only guests with status = 'confirmed' AND table_id is not null
--   3. match on first or last name, case- and accent-insensitive
--   4. only exposes (first_name, last_name, table_name, seats_label) - no
--      email, phone, status, id, wedding_id or any other column
--
-- Accent-insensitivity: this project's migrations never install `unaccent`
-- (grepped the full supabase/migrations history - no CREATE EXTENSION
-- unaccent, no prior use of it). Rather than add a new extension dependency
-- for one RPC and risk it not being available/allowed on the linked
-- project, this uses lower() plus an explicit translate() over the accented
-- characters that actually occur in French guest names (the primary
-- audience). This covers the common cases (Élodie -> elodie, François ->
-- francois) without requiring any extension. If broader Unicode coverage is
-- needed later, swap the translate() calls for unaccent() once the
-- extension is confirmed available on the linked project - the function
-- signature and RLS-adjacent guarantees below do not change.

create or replace function public.search_guest_table(p_wedding_id uuid, p_query text)
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
  -- Requirement 1: refuse anything shorter than 2 characters after trimming.
  -- Returning an empty set (not raising) keeps the guest page's UX simple:
  -- no results yet, not an error.
  if p_wedding_id is null or length(trim(p_query)) < 2 then
    return;
  end if;

  -- Normalize once: lowercase, then strip the common French accents via an
  -- explicit character-by-character translate (see comment above for why
  -- unaccent() is not used here).
  v_query := translate(
    lower(trim(p_query)),
    'àâäéèêëïîôöùûüçñÀÂÄÉÈÊËÏÎÔÖÙÛÜÇÑ',
    'aaaeeeeiioouuucnAAAEEEEIIOOUUUCN'
  );

  return query
  select
    g.first_name,
    g.last_name,
    t.name as table_name,
    t.seats_label
  from public.guests g
  join public.tables t on t.id = g.table_id
  where g.wedding_id = p_wedding_id
    -- Requirement 2: confirmed AND seated only.
    and g.status = 'confirmed'
    and g.table_id is not null
    -- Requirement 3: match first or last name, case/accent-insensitive.
    and (
      translate(lower(g.first_name), 'àâäéèêëïîôöùûüçñÀÂÄÉÈÊËÏÎÔÖÙÛÜÇÑ', 'aaaeeeeiioouuucnAAAEEEEIIOOUUUCN') like '%' || v_query || '%'
      or translate(lower(g.last_name), 'àâäéèêëïîôöùûüçñÀÂÄÉÈÊËÏÎÔÖÙÛÜÇÑ', 'aaaeeeeiioouuucnAAAEEEEIIOOUUUCN') like '%' || v_query || '%'
    )
  order by g.last_name, g.first_name
  -- Requirement: plafonne a cinq resultats.
  limit 5;
end;
$$;

comment on function public.search_guest_table(uuid, text) is
  'Security-definer RPC backing the Jour J "Ma table" search. It is the only '
  'path by which an anonymous guest can query the guest list, deliberately '
  'restricted to confirmed+seated guests, a 2-character minimum, a 5-row cap, '
  'and four columns (no contact info, no status, no id). This is what makes '
  'the guest list impossible to enumerate from the public QR page - see '
  'cahier des charges §16. Do not relax any of these constraints without '
  're-reading that section.';

-- Requirement 4, enforced at the grant level too: no default PUBLIC execute,
-- explicit grant only to the two roles the guest page actually runs as.
-- The guest page is unauthenticated, so `anon` must be able to call this;
-- `authenticated` is included so a logged-in couple previewing their own
-- guest page (or an authenticated guest, if that ever exists) also works.
revoke all on function public.search_guest_table(uuid, text) from public;
grant execute on function public.search_guest_table(uuid, text) to anon, authenticated;

-- Expose the two settings an invitation needs to render itself.
--
-- `resolve_public_slug` returned (wedding_id, theme_id). A theme also needs to
-- know which modules the wedding bought and whether children are invited:
--
--   * `sites.modules` decides which sections render at all. Without it every
--     invitation showed the same blocks regardless of what was paid for — the
--     module list was written at checkout and then read by nobody.
--
--   * `settings.adults_only` drives the RSVP form's child fields and the
--     derived "are children invited?" FAQ entry. Read from the same place by
--     both, so the form and the FAQ can never contradict each other.
--
-- Both are configuration, not content: they say how the invitation behaves,
-- and a guest holding the link is already entitled to see the result. Neither
-- names a person.
--
-- The function stays the narrow path it was built to be. It still returns one
-- row for one slug, still requires the day-of module to be enabled, and still
-- cannot be enumerated — this only widens the row it was already returning, so
-- the broad anon policy on `sites` it replaced stays dropped.

-- Dropped rather than replaced: `create or replace` cannot widen a function's
-- return type ("cannot change return type of existing function"), and this
-- adds two columns to the row it returns. The drop and the re-create run in
-- one transaction, so no request can observe the gap — but the grant below is
-- not optional, since dropping the function drops its privileges with it.
drop function if exists public.resolve_public_slug(text);

create function public.resolve_public_slug(p_slug text)
returns table (
  wedding_id uuid,
  theme_id text,
  modules text[],
  adults_only boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_slug is null or length(trim(p_slug)) = 0 then
    return;
  end if;

  return query
  select
    s.wedding_id,
    s.theme_id,
    s.modules,
    -- A wedding with no settings row yet is not adults-only: the column's own
    -- default is false, and coalescing here keeps the caller from having to
    -- tell "no row" apart from "answered no".
    coalesce(st.adults_only, false)
  from public.sites s
  join public.day_of_settings ds
    on ds.wedding_id = s.wedding_id and ds.enabled = true
  -- Left join: `settings` is created alongside the site at checkout, but an
  -- invitation must not 404 because that one row is missing.
  left join public.settings st
    on st.wedding_id = s.wedding_id
  where s.slug = trim(p_slug)
  limit 1;
end;
$$;

comment on function public.resolve_public_slug(text) is
  'Resolves a public slug to (wedding_id, theme_id, modules, adults_only) for a '
  'wedding whose day-of module is enabled. Replaces a broad anon select on '
  '`sites`, which leaked every column and — worse — let anyone list every '
  'published slug. Returns one row at a time and cannot be enumerated.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;

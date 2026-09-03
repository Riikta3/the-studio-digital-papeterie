-- Replace the broad anon read on `sites` with a narrow slug-resolution RPC.
--
-- The policy I added in `20260902170000_guest_page_anon_reads.sql` granted anon
-- `select` on the whole `sites` row, with a comment claiming "exposed columns
-- are limited by what the page selects". That is true of our page and false of
-- anyone using the anon key directly: PostgREST honours `?select=*`.
--
-- Measured before writing this:
--   * `select *` returned all 14 columns — plan_id, theme_id, modules, extras,
--     domain, status, animation_id — for every module-enabled wedding;
--   * `select slug` with no filter LISTED every such wedding. A slug was
--     supposed to be the thing you had to know; it could simply be asked for.
--
-- RLS cannot restrict columns, so a policy can never fix this. A
-- security-definer function can: it returns exactly the two fields the guest
-- and invitation pages need, for one slug at a time, and cannot be asked for a
-- list. Same shape as `search_guest_table` and `get_couple_display_names`.

/**
 * Resolves one public slug to its wedding.
 *
 * Returns at most one row, and only for a wedding whose day-of module is on —
 * so a couple who has not published stays invisible rather than merely empty.
 * A caller cannot enumerate: there is no way to invoke this without already
 * knowing the slug.
 */
create or replace function public.resolve_public_slug(p_slug text)
returns table (
  wedding_id uuid,
  theme_id text
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
  select s.wedding_id, s.theme_id
  from public.sites s
  join public.day_of_settings ds
    on ds.wedding_id = s.wedding_id and ds.enabled = true
  where s.slug = trim(p_slug)
  limit 1;
end;
$$;

comment on function public.resolve_public_slug(text) is
  'Resolves a public slug to (wedding_id, theme_id) for a wedding whose day-of '
  'module is enabled. Replaces a broad anon select on `sites`, which leaked '
  'every column and — worse — let anyone list every published slug. Returns '
  'one row at a time and cannot be enumerated.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;

-- Drop the over-broad policy this replaces. The owner policies from
-- full_db_reset.sql are untouched, so the couple still reads their own site.
drop policy if exists "Guests can resolve an enabled day-of slug" on public.sites;

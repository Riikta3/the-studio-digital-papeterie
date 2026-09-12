-- Expose the languages an invitation may be served in.
--
-- `sites.languages` holds the locales the couple bought, default first (see
-- `checkout/page.tsx`, which now writes the primary language it used to drop).
-- The public route needs it to decide what `/[locale]/invitation/...` serves:
-- a locale the couple did not buy must not render a half-translated page, and
-- the first entry is the one to fall back to.
--
-- Same narrow contract as before: one row for one slug, gated on the site
-- being published, not enumerable.

drop function if exists public.resolve_public_slug(text);

create function public.resolve_public_slug(p_slug text)
returns table (
  wedding_id uuid,
  theme_id text,
  modules text[],
  adults_only boolean,
  languages text[]
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
    coalesce(st.adults_only, false),
    s.languages
  from public.sites s
  left join public.settings st
    on st.wedding_id = s.wedding_id
  where s.slug = trim(p_slug)
    and s.status = 'published'
  limit 1;
end;
$$;

comment on function public.resolve_public_slug(text) is
  'Resolves a public slug to (wedding_id, theme_id, modules, adults_only, '
  'languages) for a PUBLISHED site. Replaces a broad anon select on `sites`, '
  'which leaked every column and let anyone list every published slug. Returns '
  'one row at a time and cannot be enumerated. Gated on sites.status, NOT on '
  'the Jour J module.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;

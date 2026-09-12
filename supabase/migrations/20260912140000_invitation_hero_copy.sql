-- The couple's own words on their invitation, and their photograph.
--
-- `InvitationData.copy` has been in the theme contract from the start, and
-- every field in it is documented as "a sentence a couple could rewrite".
-- Nothing let them: `toInvitationData` derives the hero line from a French
-- string literal ("Nous nous marions") and the date labels from the wedding
-- date, and there is no screen for any of it. Two couples buying the same
-- theme get the same words above their names.
--
-- `couple.portrait` is the same story from the other end: it is in the
-- contract, blanc-couture's closing page renders it, and it was only ever
-- populated by that theme's hardcoded demo photograph — captioned with
-- whichever couple's names the invitation carried. It was removed when the
-- themes were cleaned of demo content, which left the field with no writer at
-- all.
--
-- ## Why columns rather than `settings.theme_config`
--
-- That jsonb column exists and is unused: `create-wedding.ts` writes
-- `{themeId}` into it at checkout and nothing has ever read it back. Piling
-- free-form copy into an unread bag would hide these fields from the schema
-- and from anyone reading the table, and they are a small, known set. They get
-- names.
--
-- ## Why `settings` rather than `sites`
--
-- `settings` is already the per-wedding invitation configuration table — it
-- carries `adults_only`, which `resolve_public_slug` already joins to and the
-- RSVP form already reads. `sites` is what was bought: plan, theme, modules,
-- languages, slug, publication status. This is content, not commerce.

alter table public.settings
  add column if not exists hero_kicker   text,
  add column if not exists announcement  text,
  add column if not exists closing_words text,
  add column if not exists couple_photo_url text;

comment on column public.settings.hero_kicker is
  'The line above the couple''s names on the hero ("Nous nous marions"). '
  'Falls back to a derived default when null — see `toInvitationData`.';
comment on column public.settings.announcement is
  'The couple''s own announcement sentence, under or beside their names.';
comment on column public.settings.closing_words is
  'The closing line on the final page. Newlines are preserved: themes that '
  'set it in a display face break it deliberately.';
comment on column public.settings.couple_photo_url is
  'A photograph of the couple, for themes that frame one (blanc-couture''s '
  'closing page). Public storage URL. Null for most weddings, and a theme '
  'must render its closing page without one rather than substitute a stock '
  'image.';

-- The public reader ------------------------------------------------------
--
-- `resolve_public_slug` already returns the per-wedding configuration a theme
-- needs before it can render anything, and it is the one path anon has to
-- `sites` and `settings`. These four fields join it rather than becoming a
-- second round trip: they are needed on the same render, for the same wedding,
-- under the same publication check.
--
-- Dropped and recreated because the return type changes — `create or replace`
-- cannot alter a function's signature.

drop function if exists public.resolve_public_slug(text);

create function public.resolve_public_slug(p_slug text)
returns table (
  wedding_id uuid,
  theme_id text,
  modules text[],
  adults_only boolean,
  hero_kicker text,
  announcement text,
  closing_words text,
  couple_photo_url text
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
    st.hero_kicker,
    st.announcement,
    st.closing_words,
    st.couple_photo_url
  from public.sites s
  left join public.settings st
    on st.wedding_id = s.wedding_id
  where s.slug = trim(p_slug)
    and s.status = 'published'
  limit 1;
end;
$$;

comment on function public.resolve_public_slug(text) is
  'Resolves a public slug to the configuration a theme needs for a PUBLISHED '
  'site: identity, modules, and the copy the couple wrote. Replaces a broad '
  'anon select on `sites`, which leaked every column and let anyone list every '
  'published slug. Returns one row at a time and cannot be enumerated. Gated '
  'on sites.status, NOT on the Jour J module.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;

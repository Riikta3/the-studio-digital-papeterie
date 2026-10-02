-- Invitation music: the `custom-music` option the checkout has always sold.
-- docs/superpowers/specs/2026-10-02-invitation-music-design.md (D1, D2, D4).

-- 1. The couple's choice ------------------------------------------------------
alter table public.settings
  add column if not exists music_enabled boolean not null default true,
  add column if not exists music_track text,
  add column if not exists music_upload_path text;

comment on column public.settings.music_enabled is
  'The couple''s switch for their invitation music. Meaningful only when the '
  'site owns the `custom-music` extra: resolve_public_slug ignores it otherwise.';
comment on column public.settings.music_track is
  'Id of the chosen track in shared/data/music-library.ts; null = the library '
  'default. Not checked here, the library lives in code: an id it no longer '
  'has falls back to the default when read.';
comment on column public.settings.music_upload_path is
  'Object name of the couple''s own file in the `music` bucket '
  '(<wedding_id>/<timestamp>-<name>.<ext>); null = none. When set, it plays '
  'instead of music_track.';

-- 2. The files ----------------------------------------------------------------
-- Public like `videos` and `venue`: an invitation is public to whoever holds
-- its link. No storage policy for `authenticated`: every write goes through a
-- dashboard server action that checks the option first (a signed upload URL,
-- or the service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'music',
  'music',
  true,
  15728640, -- 15 MB
  array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']
)
on conflict (id) do nothing;

-- 3. Guests get the music only when it was paid for ---------------------------
-- `settings` is writable by the couple's own session, so a couple without the
-- option could fill the columns above by hand. This function is what makes
-- that inert. Dropped and recreated: its return table changes.
drop function if exists public.resolve_public_slug(text);

create function public.resolve_public_slug(p_slug text)
returns table (
  wedding_id uuid,
  theme_id text,
  modules text[],
  adults_only boolean,
  languages text[],
  hero_kicker text,
  announcement text,
  closing_words text,
  couple_photo_url text,
  invitation_texts jsonb,
  music_enabled boolean,
  music_track text,
  music_upload_path text
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
    s.languages,
    st.hero_kicker,
    st.announcement,
    st.closing_words,
    st.couple_photo_url,
    coalesce(st.invitation_texts, '{}'::jsonb),
    m.on_air,
    case when m.on_air then st.music_track end,
    case when m.on_air then st.music_upload_path end
  from public.sites s
  left join public.settings st
    on st.wedding_id = s.wedding_id
  cross join lateral (
    select ('custom-music' = any(coalesce(s.extras, '{}'::text[])))
       and coalesce(st.music_enabled, true) as on_air
  ) m
  where s.slug = trim(p_slug)
    and s.status = 'published'
  limit 1;
end;
$$;

comment on function public.resolve_public_slug(text) is
  'Resolves a public slug to the configuration a theme needs for a PUBLISHED '
  'site: identity, modules, languages, every word the couple wrote, and its '
  'music — the music only when the site owns the `custom-music` extra and the '
  'couple left it on. Replaces a broad anon select on `sites`, which leaked '
  'every column and let anyone list every published slug. Returns one row at a '
  'time and cannot be enumerated. Gated on sites.status, NOT on the Jour J module.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;

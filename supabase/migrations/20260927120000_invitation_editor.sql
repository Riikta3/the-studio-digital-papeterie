-- The invitation editor: somewhere to keep every word a theme prints.
--
-- The dashboard's editor (/invitation) lets a couple rewrite everything their
-- invitation says. Most of it already has a home — names on `profiles`, the
-- hero lines on `settings`, the programme in `schedule_entries`, and so on —
-- but three kinds of content had none, and this migration gives it one.
--
-- ## settings.invitation_texts — a flat { key: text } map
--
-- Two families of key share it (see shared/data/invitation-texts.ts):
--
--   * Contract copy that no screen could write: the programme's intro, the
--     footer note, the monogram, the day-after note, overrides of the derived
--     date labels. Keys are namespaced by where they land: `copy.*`,
--     `couple.*`, `dayTwo.*`.
--   * Theme slots: the words a theme prints from its own catalogue or markup —
--     "La dolce vita commence dans", "Dress code · Jour 2", the "ITALIA" stamp
--     printed on a wedding in Provence. Keyed `<section>.<role>`.
--
-- 20260912140000 argued for named columns over a jsonb bag for the hero lines,
-- because they were "a small, known set". Slots are the opposite: every theme
-- declares its own, so the set is open, while every value obeys the same rules
-- (a string, trimmed, bounded) — enforced by the one module both apps use to
-- read and write it. The column is still typed by a check: it must be an
-- object, never an array or a scalar.
--
-- ## schedule_entries.icon / image_url
--
-- The theme contract has always carried an icon and a photograph per moment,
-- and ciao-amore draws both — its showcase has a church, a spritz, a table.
-- With no column, a real wedding's icons were guessed from the title and its
-- photos were impossible. The icon is checked against the closed set the
-- themes draw (`SCHEDULE_ICONS`), so no value can reach a theme that none of
-- them knows how to draw.
--
-- ## accommodations.address / secondary
--
-- Themes print a hotel's address, and put some hotels behind a "voir plus
-- d'options" toggle. Neither could be set for a real wedding.

alter table public.settings
  add column if not exists invitation_texts jsonb not null default '{}'::jsonb;

comment on column public.settings.invitation_texts is
  'The couple''s own words for everything their invitation prints: contract '
  'copy (copy.*, couple.*, dayTwo.*) and theme slots (<section>.<role>). A flat '
  'map of strings; an absent key means "the theme''s default". Read and written '
  'through shared/data/invitation-texts.ts.';

do $$
begin
  alter table public.settings
    add constraint settings_invitation_texts_is_object
    check (jsonb_typeof(invitation_texts) = 'object');
exception
  when duplicate_object then null;
end
$$;

alter table public.schedule_entries
  add column if not exists icon text,
  add column if not exists image_url text;

do $$
begin
  alter table public.schedule_entries
    add constraint schedule_entries_icon_known
    check (icon is null or icon in ('ceremony', 'cocktail', 'dinner', 'party', 'brunch'));
exception
  when duplicate_object then null;
end
$$;

comment on column public.schedule_entries.icon is
  'Which moment this is (ceremony, cocktail, dinner, party, brunch) — every '
  'theme draws all five in its own style. Null lets the invitation guess from '
  'the title.';

alter table public.accommodations
  add column if not exists address text,
  add column if not exists secondary boolean not null default false;

comment on column public.accommodations.secondary is
  'Listed behind the invitation''s "voir plus d''options" toggle rather than '
  'as a card up front.';

-- The public reader ------------------------------------------------------
--
-- `invitation_texts` joins the one function anon has to `settings`, for the
-- same reasons the hero lines did: needed on the same render, for the same
-- wedding, under the same publication check.
--
-- `languages` comes back. 20260912130000 added it, and 20260912140000 — which
-- ran after it and recreated the function to add the hero copy — rebuilt the
-- column list without it. The invitation page still reads `site.languages` to
-- keep a guest inside the languages the couple bought; since then it has read
-- `undefined`, and that guard has silently done nothing.
--
-- Dropped and recreated because the return type changes.

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
  invitation_texts jsonb
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
    coalesce(st.invitation_texts, '{}'::jsonb)
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
  'site: identity, modules, languages, and every word the couple wrote. '
  'Replaces a broad anon select on `sites`, which leaked every column and let '
  'anyone list every published slug. Returns one row at a time and cannot be '
  'enumerated. Gated on sites.status, NOT on the Jour J module.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;

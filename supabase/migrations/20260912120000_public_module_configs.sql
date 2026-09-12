-- Let a published invitation read the content its couple wrote per module.
--
-- `site_modules.config` is where the dashboard's module screens save almost
-- everything a couple types that is not already a table of its own: the venue
-- blurb, the dress code, the timeline, the hotels, the transport notes, the
-- menu, the FAQ, the gift list. It has been written since those screens
-- existed and read by nothing — `site_modules` appears in `landing/src` only
-- as an insert at checkout.
--
-- So the couple fills in a form, presses save, and the invitation never
-- changes. This is the read side that was missing.
--
-- Narrow like the other public readers (`resolve_public_slug`,
-- `public_wedding_events`): one wedding at a time, named by the caller, and
-- only when the invitation is published. `site_modules` keeps no anon policy —
-- it is reachable through this function and nowhere else, so a direct
-- PostgREST call cannot enumerate other weddings' modules.
--
-- Ordered by `position`, which is the order the couple set in the dashboard's
-- module list, so a theme can render sections in the order they chose.

create or replace function public.public_module_configs(p_wedding_id uuid)
returns table (
  module_id text,
  "position" int,
  config jsonb
)
language sql
security definer
stable
set search_path = public
as $$
  select sm.module_id, sm."position", sm.config
  from public.site_modules sm
  join public.sites s on s.id = sm.site_id
  where s.wedding_id = p_wedding_id
    and s.status = 'published'
  order by sm."position";
$$;

comment on function public.public_module_configs(uuid) is
  'Per-module content (`site_modules.config`) for one published wedding, in the '
  'couple''s chosen order. Security definer because `site_modules` has no anon '
  'policy and must not gain one: this is the only path to it from a guest, and '
  'it takes one wedding at a time so it cannot be enumerated.';

revoke all on function public.public_module_configs(uuid) from public;
grant execute on function public.public_module_configs(uuid) to anon, authenticated;

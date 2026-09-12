-- Separate "the invitation is published" from "the Jour J module is on".
--
-- These are two different decisions that shared one switch. `day_of_settings`
-- backs the Jour J module — the QR code guests scan on the day to find their
-- table, the menu, the photo upload. Its `enabled` column is the couple's
-- deliberate "the guest page is live now", and the dashboard labels it exactly
-- that: "Activer le module Jour J".
--
-- That same column also gated the invitation: `resolve_public_slug` joined on
-- it, so a wedding with no `day_of_settings` row 404'd no matter how complete
-- its content was, and switching the Jour J module off after the wedding would
-- silently unpublish the couple's invitation. Two unrelated things, one
-- switch, and the failure mode was invisible.
--
-- The column that was meant for this already exists and was never used:
-- `sites.status` has been written 'draft' at checkout since the beginning and
-- read by nothing. This migration gives it its job.
--
--   sites.status = 'published'      -> the invitation is publicly readable
--   day_of_settings.enabled = true  -> the Jour J guest page is live
--
-- The two now move independently, which is the point.
--
-- ## Why the defaults differ
--
-- An invitation is published as soon as it is paid for: the couple buys a page
-- to send to their guests, and a draft they must discover how to publish is a
-- worse product. The Jour J module stays off until switched on deliberately —
-- it is for the day itself, and its own `false` default is load-bearing (see
-- `dashboard/src/actions/day-of-settings-actions.ts`).

-- 1. BACKFILL ----------------------------------------------------------------
--
-- Every existing site becomes published. The only rows here are the seeded
-- demos and weddings bought before this change; all of them are 404ing today
-- because they have no `day_of_settings` row, so publishing them restores the
-- invitation their owners already paid for rather than exposing anything new.
--
-- Runs before the function is repointed, so no request can see a moment where
-- a previously reachable invitation is not yet marked published.

update public.sites
set status = 'published'
where status is null or status = 'draft';

-- Guard the column against a typo silently unpublishing a wedding: without a
-- constraint, `status = 'publised'` reads as "not published" and 404s.
alter table public.sites
  drop constraint if exists sites_status_check;

alter table public.sites
  add constraint sites_status_check
  check (status in ('draft', 'published', 'archived'));

comment on column public.sites.status is
  'Publication state of the invitation. ''published'' makes it readable at its '
  'public slug; ''draft'' and ''archived'' 404. Independent of '
  'day_of_settings.enabled, which governs only the Jour J guest page.';

-- 2. THE INVITATION GATE ------------------------------------------------------
--
-- Same narrow contract as before — one row for one slug, not enumerable — with
-- the gate moved off the Jour J module and onto the site's own status.

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
    coalesce(st.adults_only, false)
  from public.sites s
  left join public.settings st
    on st.wedding_id = s.wedding_id
  where s.slug = trim(p_slug)
    and s.status = 'published'
  limit 1;
end;
$$;

comment on function public.resolve_public_slug(text) is
  'Resolves a public slug to (wedding_id, theme_id, modules, adults_only) for a '
  'PUBLISHED site. Replaces a broad anon select on `sites`, which leaked every '
  'column and let anyone list every published slug. Returns one row at a time '
  'and cannot be enumerated. Gated on sites.status, NOT on the Jour J module.';

revoke all on function public.resolve_public_slug(text) from public;
grant execute on function public.resolve_public_slug(text) to anon, authenticated;

-- 3. THE PUBLICATION PREDICATE ------------------------------------------------

/**
 * Whether a wedding's invitation is published.
 *
 * `security definer` because the policies below need to read `sites`, and anon
 * has no select policy on it — the broad one was deliberately dropped in
 * 20260903120000 and replaced by `resolve_public_slug`. A policy whose
 * subquery reads a table the caller cannot see evaluates to false for every
 * row, which silently hides all the content instead of erroring.
 *
 * Same shape, and same reasoning, as `guest_uploads_open` (20260911140000).
 * Returns one boolean about a wedding the caller has already named, so it
 * reveals nothing the invitation itself would not.
 */
create or replace function public.invitation_published(p_wedding_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.sites s
    where s.wedding_id = p_wedding_id
      and s.status = 'published'
  );
$$;

comment on function public.invitation_published(uuid) is
  'True when a wedding''s invitation is published. Security definer because '
  'anon has no select policy on `sites`; without it the anon read policies on '
  'the invitation content tables would match no rows at all.';

revoke all on function public.invitation_published(uuid) from public;
grant execute on function public.invitation_published(uuid) to anon, authenticated;

-- 4. INVITATION CONTENT POLICIES ----------------------------------------------
--
-- These four tables are the invitation's own content. Their anon read policies
-- were gated on `day_of_settings` for the same historical reason, which meant
-- a published invitation could resolve its slug and then render empty. They
-- follow `sites.status` now, so the gate matches what the page actually is.
--
-- `guest_media`, the storage policies and `public_day_of_settings` are
-- deliberately NOT touched: those are the Jour J module, and gating them on
-- the module switch is correct.

-- ── schedule_entries ────────────────────────────────────────────────────────
drop policy if exists "Guests can read schedule_entries when day_of enabled"
  on public.schedule_entries;

drop policy if exists "Guests can read schedule_entries of a published site"
  on public.schedule_entries;

create policy "Guests can read schedule_entries of a published site"
  on public.schedule_entries for select
  to anon
  using (
    public.invitation_published(schedule_entries.wedding_id)
  );

-- ── venues ──────────────────────────────────────────────────────────────────
drop policy if exists "Guests can read venues when day_of enabled"
  on public.venues;

drop policy if exists "Guests can read venues of a published site"
  on public.venues;

create policy "Guests can read venues of a published site"
  on public.venues for select
  to anon
  using (
    public.invitation_published(venues.wedding_id)
  );

-- ── accommodations ──────────────────────────────────────────────────────────
drop policy if exists "Guests can read accommodations when day_of enabled"
  on public.accommodations;

drop policy if exists "Guests can read accommodations of a published site"
  on public.accommodations;

create policy "Guests can read accommodations of a published site"
  on public.accommodations for select
  to anon
  using (
    public.invitation_published(accommodations.wedding_id)
  );

-- ── faq_entries ─────────────────────────────────────────────────────────────
-- `published` on the row itself is a second, independent switch: the couple
-- can draft a single answer without unpublishing the invitation.
drop policy if exists "Guests can read published faq_entries when day_of enabled"
  on public.faq_entries;

drop policy if exists "Guests can read published faq_entries of a published site"
  on public.faq_entries;

create policy "Guests can read published faq_entries of a published site"
  on public.faq_entries for select
  to anon
  using (
    published = true
    and public.invitation_published(faq_entries.wedding_id)
  );

-- 4. EVENTS -------------------------------------------------------------------
--
-- Serves both surfaces, like the names below. It matters most to the
-- invitation: `getInvitationPage` returns null for a wedding with no event, so
-- while this was gated on the Jour J module a published invitation would
-- resolve its slug and then 404 on empty events — the same bug one step later.

create or replace function public.public_wedding_events(p_wedding_id uuid)
returns table (
  id uuid,
  key text,
  name text,
  date date,
  "time" text,
  address text,
  description text,
  dress_code text,
  "position" int
)
language sql
security definer
stable
set search_path = public
as $$
  select
    e.id, e.key, e.name, e.date, e."time",
    e.address, e.description, e.dress_code, e."position"
  from public.events e
  join public.sites s on s.wedding_id = e.wedding_id
  where e.wedding_id = p_wedding_id
    and e.enabled = true
    and s.slug is not null
    and (
      s.status = 'published'
      or exists (
        select 1 from public.day_of_settings ds
        where ds.wedding_id = e.wedding_id and ds.enabled = true
      )
    )
  order by e."position";
$$;

comment on function public.public_wedding_events(uuid) is
  'Enabled events of one wedding, for the anonymous guest and invitation '
  'pages, when the invitation is published OR the Jour J module is enabled. '
  'Replaces an anon policy that let `select=*` return every wedding''s events '
  'and enumerate wedding_id. Takes one wedding at a time by design.';

revoke all on function public.public_wedding_events(uuid) from public;
grant execute on function public.public_wedding_events(uuid) to anon, authenticated;

-- 5. COUPLE NAMES -------------------------------------------------------------
--
-- Read by both surfaces: the invitation prints the couple's names, and the
-- Jour J page greets them. Gated on either being live, so neither can be
-- switched off by the other's switch.

create or replace function public.get_couple_display_names(p_wedding_id uuid)
returns table (
  first_name text,
  partner_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_wedding_id is null then
    return;
  end if;

  return query
  select
    p.first_name,
    p.partner_name
  from public.weddings w
  join public.profiles p on p.id = w.user_id
  where w.id = p_wedding_id
    and (
      -- The invitation is published …
      exists (
        select 1 from public.sites s
        where s.wedding_id = w.id and s.status = 'published'
      )
      -- … or the Jour J guest page is live. Either surface may greet them.
      or exists (
        select 1 from public.day_of_settings ds
        where ds.wedding_id = w.id and ds.enabled = true
      )
    )
  limit 1;
end;
$$;

comment on function public.get_couple_display_names(uuid) is
  'Security-definer RPC returning only the two couple display names for a '
  'wedding whose invitation is published OR whose Jour J module is enabled. '
  'It exists so anonymous guest-facing pages can greet the couple by name '
  'without any anon access to `profiles`, which also holds private fields.';

revoke all on function public.get_couple_display_names(uuid) from public;
grant execute on function public.get_couple_display_names(uuid) to anon, authenticated;

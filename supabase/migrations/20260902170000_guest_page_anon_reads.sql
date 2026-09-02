-- Anonymous reads the Jour J guest page needs (cahier §16).
--
-- Found by testing with the real anon key rather than by reading policies:
-- the page a guest reaches by scanning the printed QR code could not work at
-- all. Three reads it depends on returned zero rows:
--
--   sites            -> cannot resolve the slug in the URL to a wedding
--   day_of_settings  -> cannot tell whether the module is switched on
--   menu_categories  -> returned 0 even though its own anon policy is correct,
--                       because that policy's subquery reads day_of_settings,
--                       which anon could not read either
--
-- `20260902100000_day_of_module.sql` added the anon policies for the menu but
-- not the two rows those policies depend on. This closes that gap.
--
-- What is deliberately NOT opened: `guests`, `guest_events`, `households`,
-- `profiles`, `weddings`. A guest reaches guest data only through
-- `search_guest_table` (security definer, 2-char minimum, 5-row cap,
-- confirmed+seated only, four columns). Adding a select policy to `guests`
-- "for convenience" would make the roster enumerable by anyone holding the
-- URL, which is the exact failure §16 exists to prevent.

-- ── sites: slug resolution only ──────────────────────────────────────────────
-- The slug is the public identifier printed on the QR code; resolving it is
-- the first thing the page does. Exposed columns are limited by what the page
-- selects, but the row itself carries plan/theme/domain data, so the policy is
-- gated on the wedding actually having the day-of module enabled — a wedding
-- that never turned it on stays invisible.
create policy "Guests can resolve an enabled day-of slug"
  on public.sites for select
  to anon
  using (
    exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = sites.wedding_id
        and ds.enabled = true
    )
  );

-- ── day_of_settings: the on/off switch and the upload window ─────────────────
-- The page reads `enabled` (should this page exist at all),
-- `gallery_visible_to_guests` (may they browse photos),
-- `uploads_open_until` (may they still add one) and `after_wedding_mode`
-- (which copy to show). None of it is sensitive; all of it is needed before
-- the page can render.
--
-- Restricted to rows where `enabled = true`: a couple who has not switched the
-- module on leaks nothing, not even that the wedding exists.
create policy "Guests can read enabled day_of_settings"
  on public.day_of_settings for select
  to anon
  using (enabled = true);

comment on policy "Guests can read enabled day_of_settings" on public.day_of_settings is
  'Lets the anonymous QR page decide whether to render and whether uploads are '
  'still open. Only rows with enabled = true are visible, so a wedding that '
  'never enabled the module is invisible rather than merely empty.';

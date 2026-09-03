-- Schema gaps found while wiring the dashboard to the database (step 2).
--
-- The five step-1 migrations were written against `shared/types/jour-j.ts` and
-- `shared/types/invitation.ts`, but three fields those types declare have no
-- column behind them. Probed the live schema column by column before writing
-- this, so each addition below is a real gap, not a guess:
--
--   tables      -> no `x`, no `y`   (only `position` and `shape`)
--   guests      -> no `phone`
--   households  -> no group column
--
-- Without these, the seating canvas cannot persist where the couple dragged a
-- table, and the guest/household editors would silently drop a field the form
-- already collects.

-- Seating canvas coordinates. The board is desktop-only and free-form: the
-- couple drags tables to mirror their real room, so the position is content,
-- not presentation, and has to survive a reload. `position` stays as the
-- mobile ordering key — the phone view is a list, not a canvas.
alter table public.tables add column if not exists x int default 0;
alter table public.tables add column if not exists y int default 0;

comment on column public.tables.x is
  'Seating-canvas X in px (desktop board). Content, not presentation: it '
  'mirrors the physical room layout the couple arranged.';
comment on column public.tables.y is
  'Seating-canvas Y in px (desktop board). See tables.x.';

-- `InvitationGuest.phone` — the guest form collects it; there was nowhere to
-- put it. `households` already has `phone`, so this is per-guest contact for
-- the cases where one household member is the point of contact.
alter table public.guests add column if not exists phone text;

-- `Household.group` — the same four buckets as `guests.guest_group`, and the
-- same column name for consistency, since `group` is a reserved word in SQL
-- and would need quoting everywhere.
alter table public.households
  add column if not exists guest_group text
  check (guest_group in ('family', 'friends', 'colleagues', 'other'))
  default 'other';

comment on column public.households.guest_group is
  'Mirrors guests.guest_group. Named guest_group rather than group because '
  '`group` is a reserved word and would need quoting at every call site.';

-- The Jour J QR slug lives on `sites.slug`, which already exists and is
-- already unique — `day_of_settings` deliberately does NOT get its own
-- `qr_slug`. Two slug columns would be two sources of truth for the same
-- public URL, and the permanent-QR requirement (cahier §14: the printed code
-- must never break) is easier to honour with one. `DayOfSettings.qrSlug` is
-- therefore populated from `sites.slug` when the settings are read, not
-- stored twice.

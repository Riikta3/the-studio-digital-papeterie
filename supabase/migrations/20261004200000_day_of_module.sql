-- « Trouve ta place » (the Jour J guest page) becomes a module the couple buys.
--
-- `grant_modules` only makes live the ids it finds in the `modules` registry,
-- so a payment for it from the dashboard needs its row here. It is no
-- invitation section: no theme draws it, and its `site_modules` row stays
-- empty. Who may switch the Jour J on is decided by `dayOfIncluded`
-- (shared/lib/day-of-access.ts) from `sites.modules`.
insert into public.modules (id, name, default_order, description)
values ('jour-j', 'Trouve ta place', 16, 'Un QR code permet à chaque invité de retrouver sa table')
on conflict (id) do update set
  name = excluded.name,
  default_order = excluded.default_order,
  description = excluded.description;

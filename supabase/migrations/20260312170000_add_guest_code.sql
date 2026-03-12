-- Separate guest access code from wedding_code (URL slug)
-- wedding_code = URL identifier (slug)
-- guest_code   = access gate code shown to guests
alter table public.settings
  add column if not exists guest_code text;

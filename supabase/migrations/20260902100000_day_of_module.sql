-- Day-of module (spec: docs/superpowers/specs/2026-09-01-back-office-maries-jour-j-design.md, §6)
--
-- Backs the couple's Jour J dashboard screens (plan de table, menu, photos,
-- reglages) which today run entirely on shared/data/jour-j-mock.ts. Column
-- names map onto shared/types/jour-j.ts: day_of_settings -> DayOfSettings,
-- menu_categories/menu_items -> MenuCategory/MenuItem, guest_media -> GuestMedia.
--
-- RLS follows the couple-owner idiom used everywhere else in this schema:
--   exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
-- Anonymous guest access (insert/select on guest_media only) is added on top,
-- gated by day_of_settings so the couple controls the window and visibility.

-- 1. DAY_OF_SETTINGS ---------------------------------------------------------

create table if not exists public.day_of_settings (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  enabled boolean default false,
  gallery_visible_to_guests boolean default false,
  uploads_open_until timestamptz,
  after_wedding_mode boolean default false,
  venue_plan_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(wedding_id)
);

alter table public.day_of_settings enable row level security;

-- Couple: full control over their own Jour J settings.
create policy "Owner can manage own day_of_settings"
  on public.day_of_settings for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

create index if not exists idx_day_of_settings_wedding_id on public.day_of_settings(wedding_id);

-- 2. MENU_CATEGORIES ----------------------------------------------------------

create table if not exists public.menu_categories (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  -- Fixed set from shared/types/jour-j.ts MENU_CATEGORY_KEYS; keep in sync if the
  -- TS union ever changes.
  key text check (key in ('cocktail', 'starter', 'main', 'cheese', 'dessert', 'drinks')) not null,
  enabled boolean default true,
  position int default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.menu_categories enable row level security;

create policy "Owner can manage own menu_categories"
  on public.menu_categories for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

-- Guests: the Jour J guest page renders the menu, but only while the module
-- is switched on for that wedding. No insert/update/delete for anon — the
-- couple edits the menu, guests only read it.
create policy "Guests can read enabled menu_categories"
  on public.menu_categories for select
  to anon
  using (
    enabled = true
    and exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = menu_categories.wedding_id
        and ds.enabled = true
    )
  );

create index if not exists idx_menu_categories_wedding_id on public.menu_categories(wedding_id);

-- 3. MENU_ITEMS -----------------------------------------------------------

create table if not exists public.menu_items (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.menu_categories(id) on delete cascade not null,
  name text not null,
  description text,
  -- Carried from day one but not exposed in V1 UI (per-guest menu is a later
  -- phase); the column exists so that phase needs no migration.
  variant text check (variant in ('classic', 'veggie', 'child')),
  position int default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.menu_items enable row level security;

-- No direct wedding_id on menu_items: reach the wedding through the parent
-- category, same as the parent's own owner check.
create policy "Owner can manage own menu_items"
  on public.menu_items for all
  using (
    exists (
      select 1
      from public.menu_categories mc
      join public.weddings w on w.id = mc.wedding_id
      where mc.id = category_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.menu_categories mc
      join public.weddings w on w.id = mc.wedding_id
      where mc.id = category_id and w.user_id = auth.uid()
    )
  );

create policy "Guests can read items of enabled menu_categories"
  on public.menu_items for select
  to anon
  using (
    exists (
      select 1
      from public.menu_categories mc
      join public.day_of_settings ds on ds.wedding_id = mc.wedding_id
      where mc.id = category_id
        and mc.enabled = true
        and ds.enabled = true
    )
  );

create index if not exists idx_menu_items_category_id on public.menu_items(category_id);

-- 4. GUEST_MEDIA --------------------------------------------------------------

create table if not exists public.guest_media (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  kind text check (kind in ('photo', 'video')) not null,
  storage_path text not null,
  thumb_path text,
  uploader_name text,
  hidden boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.guest_media enable row level security;

-- Couple: full control, including hiding/deleting media guests uploaded.
create policy "Owner can manage own guest_media"
  on public.guest_media for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

-- Guests: insert only while the upload window is open. §21 keeps "who can
-- upload" and "who can see the gallery" as two independent settings, so this
-- checks uploads_open_until only, never gallery_visible_to_guests.
create policy "Guests can upload media while the window is open"
  on public.guest_media for insert
  to anon
  with check (
    exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = guest_media.wedding_id
        and ds.uploads_open_until is not null
        and ds.uploads_open_until > now()
    )
  );

-- Guests: read only visible, non-hidden media. This is the other half of the
-- §21 split — visibility does not imply upload rights and vice versa.
create policy "Guests can read visible non-hidden guest_media"
  on public.guest_media for select
  to anon
  using (
    hidden = false
    and exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = guest_media.wedding_id
        and ds.gallery_visible_to_guests = true
    )
  );

create index if not exists idx_guest_media_wedding_id on public.guest_media(wedding_id);
create index if not exists idx_guest_media_wedding_id_created_at on public.guest_media(wedding_id, created_at);

-- 5. TABLES: seating labels & manual ordering ---------------------------------

alter table public.tables add column if not exists seats_label text;
alter table public.tables add column if not exists position int default 0;

comment on column public.tables.seats_label is 'Optional second label printed on the physical table, e.g. "Table 12", shown next to the couple''s own name for it.';
comment on column public.tables.position is 'Manual display order for the mobile accordion list (§5.2). Independent of x/y, which are desktop canvas coordinates only.';

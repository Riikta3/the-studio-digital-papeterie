-- Invitation content: schedule, venue, accommodation, FAQ (spec §8, cahier §6/§8/§9)
-- and structured meals on guests (cahier §3).
--
-- Maps onto shared/types/invitation.ts: schedule_entries -> ScheduleEntry,
-- venues -> Venue, accommodations -> Accommodation, faq_entries -> FaqEntry.

-- 1. SCHEDULE_ENTRIES -----------------------------------------------------------

create table if not exists public.schedule_entries (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  time text not null,
  title text not null,
  description text,
  position int default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.schedule_entries enable row level security;

create policy "Owner can manage own schedule_entries"
  on public.schedule_entries for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

-- Guests: the invitation "programme" tab renders this, gated on the day-of
-- module being enabled (the guest-facing Jour J page is the only place this
-- reaches an anonymous visitor today).
create policy "Guests can read schedule_entries when day_of enabled"
  on public.schedule_entries for select
  to anon
  using (
    exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = schedule_entries.wedding_id
        and ds.enabled = true
    )
  );

create index if not exists idx_schedule_entries_wedding_id on public.schedule_entries(wedding_id);
create index if not exists idx_schedule_entries_event_id on public.schedule_entries(event_id);

-- 2. VENUES -----------------------------------------------------------------

create table if not exists public.venues (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  address text,
  city text,
  maps_url text,
  waze_url text,
  parking_info text,
  access_info text,
  transport_info text,
  photo_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  unique(wedding_id)
);

alter table public.venues enable row level security;

create policy "Owner can manage own venues"
  on public.venues for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

create policy "Guests can read venues when day_of enabled"
  on public.venues for select
  to anon
  using (
    exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = venues.wedding_id
        and ds.enabled = true
    )
  );

create index if not exists idx_venues_wedding_id on public.venues(wedding_id);

-- 3. ACCOMMODATIONS -----------------------------------------------------------

create table if not exists public.accommodations (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  city text,
  distance text,
  phone text,
  booking_url text,
  offer text,
  photo_url text,
  position int default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.accommodations enable row level security;

create policy "Owner can manage own accommodations"
  on public.accommodations for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

create policy "Guests can read accommodations when day_of enabled"
  on public.accommodations for select
  to anon
  using (
    exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = accommodations.wedding_id
        and ds.enabled = true
    )
  );

create index if not exists idx_accommodations_wedding_id on public.accommodations(wedding_id);

-- 4. FAQ_ENTRIES --------------------------------------------------------------

create table if not exists public.faq_entries (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  question text not null,
  answer text not null,
  position int default 0,
  -- Hidden entries stay editable but do not reach the invitation.
  published boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.faq_entries enable row level security;

create policy "Owner can manage own faq_entries"
  on public.faq_entries for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

-- Guests only ever see published entries, and only when day_of is enabled.
create policy "Guests can read published faq_entries when day_of enabled"
  on public.faq_entries for select
  to anon
  using (
    published = true
    and exists (
      select 1 from public.day_of_settings ds
      where ds.wedding_id = faq_entries.wedding_id
        and ds.enabled = true
    )
  );

create index if not exists idx_faq_entries_wedding_id on public.faq_entries(wedding_id);

-- 5. GUESTS: structured meals (cahier §3) --------------------------------------
--
-- Replaces the free-text dietary_requirements with structured fields that
-- match shared/types/invitation.ts InvitationGuest. dietary_requirements is
-- KEPT for now: dropping a column with live data is a decision for the user
-- to make after reviewing what, if anything, needs to be migrated into the
-- new columns first. Follow-up: once the dashboard writes meal/dietary_flags
-- exclusively, backfill from dietary_requirements (best-effort, it's free
-- text) and then drop the old column in a later migration.

alter table public.guests add column if not exists meal text check (meal in ('standard', 'vegetarian', 'vegan', 'child')) default 'standard';
alter table public.guests add column if not exists dietary_flags text[] default '{}';
alter table public.guests add column if not exists allergies text;
alter table public.guests add column if not exists notes text;
alter table public.guests add column if not exists guest_group text check (guest_group in ('family', 'friends', 'colleagues', 'other')) default 'other';

comment on column public.guests.dietary_requirements is 'Deprecated free-text field, superseded by meal/dietary_flags/allergies. Kept until the user decides to backfill and drop it — do not remove in an automated migration.';
comment on column public.guests.meal is 'Structured meal choice (cahier §3), replacing free-text dietary_requirements.';
comment on column public.guests.dietary_flags is 'Multi-select dietary flags, e.g. gluten-free, halal. See shared/types/invitation.ts DIETARY_FLAGS.';
comment on column public.guests.allergies is 'Free text on purpose: a real allergy list cannot be enumerated in advance.';
comment on column public.guests.guest_group is 'Grouping used by /guests/groupes and the invitation guest list (family/friends/colleagues/other).';

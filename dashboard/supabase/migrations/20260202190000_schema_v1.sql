-- Migration: Add Households and Settings Architecture

-- 1. Create TABLE households
create table public.households (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.profiles(id) not null,
  name text not null, -- e.g. "Famille Dupont"
  email text, -- Main contact email
  phone text,
  address text,
  status text check (status in ('pending', 'confirmed', 'declined', 'partial')) default 'pending',
  magic_link_token uuid default uuid_generate_v4(), 
  message_to_couple text,
  last_relance_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Households
alter table public.households enable row level security;

create policy "Users can view own households" on public.households
  for select using (auth.uid() = wedding_id);

create policy "Users can insert own households" on public.households
  for insert with check (auth.uid() = wedding_id);

create policy "Users can update own households" on public.households
  for update using (auth.uid() = wedding_id);

create policy "Users can delete own households" on public.households
  for delete using (auth.uid() = wedding_id);


-- 2. Create TABLE settings (Wedding Configuration)
create table public.settings (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.profiles(id) not null,
  
  -- Module Activations (Toggles)
  is_module_accommodation_enabled boolean default false,
  is_module_schedule_enabled boolean default true,
  is_module_gallery_enabled boolean default false,
  is_module_rsvp_meal_enabled boolean default true,
  
  -- Configuration JSON (Fonts, Colors, Advanced logic)
  theme_config jsonb default '{}'::jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id) -- One settings row per wedding
);

-- RLS for Settings
alter table public.settings enable row level security;

create policy "Users can view own settings" on public.settings
  for select using (auth.uid() = wedding_id);

create policy "Users can update own settings" on public.settings
  for update using (auth.uid() = wedding_id);

create policy "Users can insert own settings" on public.settings
  for insert with check (auth.uid() = wedding_id);


-- 3. Modify TABLE guests (Link to Households)
-- We add household_id. Ideally this should be NOT NULL in the future, but for migration we keep it nullable or we default it?
-- For now, nullable, but application logic should enforce it.
alter table public.guests 
  add column household_id uuid references public.households(id);

-- Add refined status for individual guests
alter table public.guests
  add column is_child boolean default false,
  add column is_plus_one boolean default false;

-- Update RLS for guests to allow access if you own the household
-- (Existing policies on wedding_id still work if we keep wedding_id on guests, which we do for now for denormalization performance)
-- If we wanted to remove wedding_id from guests, we would need a join policy, which can be expensive.
-- Decision: Keep wedding_id on guests for easy RLS.

-- Index for performance
create index idx_households_wedding_id on public.households(wedding_id);
create index idx_guests_household_id on public.guests(household_id);

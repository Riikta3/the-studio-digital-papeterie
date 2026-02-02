-- Migration: Full Schema V1 (Baseline)

-- 0. Ensure public schema and extensions exist
create schema if not exists public;
create extension if not exists "uuid-ossp";

-- PROFILES (Linked to Auth Users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  first_name text,
  last_name text,
  wedding_date date,
  partner_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;
do $$ begin
  create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;


-- GUESTS (Invités) - Initial structure
create table if not exists public.guests (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  first_name text not null,
  last_name text not null,
  email text,
  status text check (status in ('pending', 'confirmed', 'declined')) default 'pending',
  dietary_requirements text,
  table_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Guests
alter table public.guests enable row level security;
do $$ begin
  create policy "Users can view own guests" on public.guests for select using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert own guests" on public.guests for insert with check (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own guests" on public.guests for update using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can delete own guests" on public.guests for delete using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;


-- TABLES (Plan de table)
create table if not exists public.tables (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  name text not null,
  shape text default 'round',
  capacity int default 8,
  x_position int default 0,
  y_position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Tables
alter table public.tables enable row level security;
do $$ begin
  create policy "Users can manage own tables" on public.tables for all using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;


-- 1. Create TABLE households
create table if not exists public.households (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  name text not null,
  email text,
  phone text,
  address text,
  status text check (status in ('pending', 'confirmed', 'declined', 'partial')) default 'pending',
  magic_link_token uuid default gen_random_uuid(), 
  message_to_couple text,
  last_relance_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Households
alter table public.households enable row level security;
do $$ begin
  create policy "Users can view own households" on public.households for select using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert own households" on public.households for insert with check (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own households" on public.households for update using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can delete own households" on public.households for delete using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;


-- 2. Create TABLE settings (Wedding Configuration)
create table if not exists public.settings (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  is_module_accommodation_enabled boolean default false,
  is_module_schedule_enabled boolean default true,
  is_module_gallery_enabled boolean default false,
  is_module_rsvp_meal_enabled boolean default true,
  theme_config jsonb default '{}'::jsonb,
  wedding_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id)
);

-- RLS for Settings
alter table public.settings enable row level security;
do $$ begin
  create policy "Users can view own settings" on public.settings for select using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own settings" on public.settings for update using (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can insert own settings" on public.settings for insert with check (auth.uid() = wedding_id);
exception when duplicate_object then null; end $$;


-- 3. Modify TABLE guests (Link to Households)
-- Using DO block to avoid error if column already exists
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='guests' and column_name='household_id') then
    alter table public.guests add column household_id uuid references public.households(id);
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name='guests' and column_name='is_child') then
      alter table public.guests add column is_child boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns where table_name='guests' and column_name='is_plus_one') then
      alter table public.guests add column is_plus_one boolean default false;
  end if;
end $$;

-- Indexes (If not exists logic is tricky for indexes, usually just create if name collision isn't an issue, typically safe with 'if not exists' in newer PG versions or just ignore error)
drop index if exists idx_households_wedding_id;
create index idx_households_wedding_id on public.households(wedding_id);

drop index if exists idx_guests_household_id;
create index idx_guests_household_id on public.guests(household_id);

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Linked to Auth Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  first_name text,
  last_name text,
  wedding_date date,
  partner_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- GUESTS (Invités)
create table public.guests (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.profiles(id) not null,
  first_name text not null,
  last_name text not null,
  email text,
  status text check (status in ('pending', 'confirmed', 'declined')) default 'pending',
  dietary_requirements text,
  table_id uuid, -- Link to tables later
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Guests (CRITICAL SECURITY)
alter table public.guests enable row level security;

-- Policy: "Je ne peux voir que les invités liés à MON id de mariage (profile)"
create policy "Users can view own guests" on public.guests
  for select using (auth.uid() = wedding_id);

create policy "Users can insert own guests" on public.guests
  for insert with check (auth.uid() = wedding_id);

create policy "Users can update own guests" on public.guests
  for update using (auth.uid() = wedding_id);

create policy "Users can delete own guests" on public.guests
  for delete using (auth.uid() = wedding_id);

-- TABLES (Plan de table)
create table public.tables (
  id uuid default uuid_generate_v4() primary key,
  wedding_id uuid references public.profiles(id) not null,
  name text not null,
  shape text default 'round', -- round, rectangular
  capacity int default 8,
  x_position int default 0,
  y_position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Tables
alter table public.tables enable row level security;
create policy "Users can manage own tables" on public.tables
  for all using (auth.uid() = wedding_id);


-- Create UUID extension if not exists
create extension if not exists "uuid-ossp";

-- DROP to ensure clean slate if partial migration happened
drop table if exists public.projects cascade;
drop table if exists public.purchases cascade;

-- Create PROJECTS Table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  state jsonb default '{}'::jsonb, 
  theme_id text,
  status text check (status in ('draft', 'published')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id)
);

alter table public.projects enable row level security;

create policy "Users can view own project" on public.projects for select using (auth.uid() = wedding_id);
create policy "Users can insert own project" on public.projects for insert with check (auth.uid() = wedding_id);
create policy "Users can update own project" on public.projects for update using (auth.uid() = wedding_id);

-- Create PURCHASES Table (The "Wallet")
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  item_type text not null, -- 'plan', 'module', 'extra', 'language'
  item_id text not null, -- 'premium', 'rsvp', 'domain', 'it'
  price_paid integer default 0,
  currency text default 'EUR',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.purchases enable row level security;

create policy "Users can view own purchases" on public.purchases for select using (auth.uid() = wedding_id);
-- Only service_role should insert purchases usually, but for dev/create flow we might need insert policy if done client side.
-- Wait, create-wedding.ts runs on server with service_role? Yes, supabaseAdmin.
-- So we don't strictly need insert policy for authenticated users if we only create purchases via server actions using admin client.

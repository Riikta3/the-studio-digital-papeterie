 -- Migration: Schema V2 (1 User = N Weddings)
-- Warning: DESTRUCTIVE MIGRATION. Drops all data.

drop table if exists public.email_logs cascade;
drop table if exists public.email_campaigns cascade;
drop table if exists public.purchases cascade;
drop table if exists public.projects cascade;
drop table if exists public.sites cascade;
drop table if exists public.billing cascade;
drop table if exists public.settings cascade;
drop table if exists public.guests cascade;
drop table if exists public.households cascade;
drop table if exists public.tables cascade;
drop table if exists public.weddings cascade;
drop table if exists public.profiles cascade;

-- 1. PROFILES (Linked to Auth Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  first_name text,
  last_name text,
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 2. WEDDINGS (The core entity, 1 User -> N Weddings)
create table public.weddings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  partner_name text,
  wedding_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.weddings enable row level security;
create policy "Users can view own weddings" on public.weddings for select using (auth.uid() = user_id);
create policy "Users can insert own weddings" on public.weddings for insert with check (auth.uid() = user_id);
create policy "Users can update own weddings" on public.weddings for update using (auth.uid() = user_id);
create policy "Users can delete own weddings" on public.weddings for delete using (auth.uid() = user_id);

-- 3. SITES (Static template configs)
create table public.sites (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  plan_id text not null default 'essential',
  theme_id text not null,
  modules text[] default '{}',
  languages text[] default '{fr}',
  extras text[] default '{}',
  domain text,
  status text default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id)
);

alter table public.sites enable row level security;
create policy "Users can view own site config" on public.sites for select using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);
create policy "Users can update own site config" on public.sites for update using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);
create policy "Users can insert own site config" on public.sites for insert with check (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- 4. SETTINGS
create table public.settings (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  is_module_accommodation_enabled boolean default false,
  is_module_schedule_enabled boolean default true,
  is_module_gallery_enabled boolean default false,
  is_module_rsvp_meal_enabled boolean default true,
  rsvp_mode text check (rsvp_mode in ('open', 'closed')) default 'closed',
  theme_config jsonb default '{}'::jsonb,
  wedding_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id)
);

alter table public.settings enable row level security;
create policy "Users can view own settings" on public.settings for select using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);
create policy "Users can update own settings" on public.settings for update using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);
create policy "Users can insert own settings" on public.settings for insert with check (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- 5. PURCHASES
create table public.purchases (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  item_type text not null,
  item_id text not null,
  price_paid integer default 0,
  currency text default 'EUR',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.purchases enable row level security;
create policy "Users can view own purchases" on public.purchases for select using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- 6. HOUSEHOLDS
create table public.households (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  source text check (source in ('admin', 'public')) default 'admin',
  email text,
  phone text,
  address text,
  status text check (status in ('pending', 'confirmed', 'declined', 'partial')) default 'pending',
  magic_link_token uuid default gen_random_uuid(), 
  message_to_couple text,
  last_relance_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.households enable row level security;
create policy "Users can manage own households" on public.households for all using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- 7. TABLES (Plan de table)
create table public.tables (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  shape text default 'round',
  capacity int default 8,
  x_position int default 0,
  y_position int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tables enable row level security;
create policy "Users can manage own tables" on public.tables for all using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- 8. GUESTS
create table public.guests (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  household_id uuid references public.households(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  status text check (status in ('pending', 'confirmed', 'declined')) default 'pending',
  dietary_requirements text,
  table_id uuid references public.tables(id) on delete set null,
  is_child boolean default false,
  is_plus_one boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.guests enable row level security;
create policy "Users can manage own guests" on public.guests for all using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- 9. EMAIL CAMPAIGNS & LOGS
create table public.email_campaigns (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  subject text not null,
  content text,
  status text check (status in ('draft', 'scheduled', 'sending', 'sent', 'archived')) default 'draft',
  scheduled_at timestamp with time zone,
  audience_filter jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.email_campaigns enable row level security;
create policy "Users can manage own campaigns" on public.email_campaigns for all using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

create table public.email_logs (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  campaign_id uuid references public.email_campaigns(id) on delete set null,
  recipient_email text not null,
  household_id uuid references public.households(id) on delete set null,
  status text check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'failed')) default 'queued',
  provider_id text,
  error_message text,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.email_logs enable row level security;
create policy "Users can manage own email logs" on public.email_logs for all using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- 10. BILLING
create table public.billing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount integer not null,
  currency text default 'EUR',
  status text check (status in ('succeeded', 'pending', 'failed', 'refunded')) default 'pending',
  plan_name text,
  payment_method text default 'card',
  invoice_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.billing enable row level security;
create policy "Users can view own billing" on public.billing for select using (auth.uid() = user_id);

-- 11. PROJECTS (Deprecated but kept for previous implementations?)
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  state jsonb default '{}'::jsonb, 
  theme_id text,
  status text check (status in ('draft', 'published')) default 'draft',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(wedding_id)
);

alter table public.projects enable row level security;
create policy "Users can manage own project" on public.projects for all using (
  exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
);

-- INDEXES
create index idx_weddings_user_id on public.weddings(user_id);
create index idx_sites_wedding_id on public.sites(wedding_id);
create index idx_settings_wedding_id on public.settings(wedding_id);
create index idx_purchases_wedding_id on public.purchases(wedding_id);
create index idx_households_wedding_id on public.households(wedding_id);
create index idx_guests_wedding_id on public.guests(wedding_id);
create index idx_guests_household_id on public.guests(household_id);
create index idx_tables_wedding_id on public.tables(wedding_id);
create index idx_email_campaigns_wedding_id on public.email_campaigns(wedding_id);
create index idx_email_logs_wedding_id on public.email_logs(wedding_id);
create index idx_email_logs_campaign_id on public.email_logs(campaign_id);
create index idx_billing_user_id on public.billing(user_id);
create index idx_projects_wedding_id on public.projects(wedding_id);

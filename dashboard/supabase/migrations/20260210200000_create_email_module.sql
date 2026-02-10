-- Migration: Email & Communication Module

-- 1. Create Campaigns Table
create table if not exists public.email_campaigns (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  name text not null, -- Internal name (e.g. "Relance 1")
  subject text not null, -- Email subject
  content text, -- HTML content or JSON (if using visual editor)
  status text check (status in ('draft', 'scheduled', 'sending', 'sent', 'archived')) default 'draft',
  scheduled_at timestamp with time zone,
  audience_filter jsonb default '{}'::jsonb, -- e.g. { "status": "pending" }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Campaigns
alter table public.email_campaigns enable row level security;

create policy "Users can view own campaigns" on public.email_campaigns
  for select using (auth.uid() = wedding_id);

create policy "Users can insert own campaigns" on public.email_campaigns
  for insert with check (auth.uid() = wedding_id);

create policy "Users can update own campaigns" on public.email_campaigns
  for update using (auth.uid() = wedding_id);

create policy "Users can delete own campaigns" on public.email_campaigns
  for delete using (auth.uid() = wedding_id);


-- 2. Create Email Logs Table
create table if not exists public.email_logs (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
  campaign_id uuid references public.email_campaigns(id), -- Optional (could be transactional email)
  recipient_email text not null,
  household_id uuid references public.households(id), -- Link to household
  status text check (status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'failed')) default 'queued',
  provider_id text, -- ID from Resend/SendGrid
  error_message text,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Logs
alter table public.email_logs enable row level security;

create policy "Users can view own email logs" on public.email_logs
  for select using (auth.uid() = wedding_id);


-- 3. Create Index for performance
create index idx_email_campaigns_wedding_id on public.email_campaigns(wedding_id);
create index idx_email_logs_wedding_id on public.email_logs(wedding_id);
create index idx_email_logs_campaign_id on public.email_logs(campaign_id);

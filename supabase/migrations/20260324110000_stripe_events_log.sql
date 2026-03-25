-- supabase/migrations/20260324110000_stripe_events_log.sql
create table if not exists public.stripe_events (
  id uuid default gen_random_uuid() primary key,
  stripe_event_id text unique not null,
  event_type text not null,
  payment_intent_id text,
  customer_email text,
  amount_cents integer,
  currency text,
  status text not null,
  raw_payload jsonb,
  created_at timestamptz default now() not null
);

alter table public.stripe_events enable row level security;

create policy "service_role_only" on public.stripe_events
  using (auth.role() = 'service_role');

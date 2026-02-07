
-- Create Billing Table
create table if not exists public.billing (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  amount integer not null, -- stored in cents
  currency text default 'EUR',
  status text check (status in ('succeeded', 'pending', 'failed', 'refunded')) default 'pending',
  plan_name text,
  payment_method text default 'card',
  invoice_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.billing enable row level security;

-- Policies
create policy "Users can view own billing"
  on public.billing for select
  using (auth.uid() = user_id);

-- Only service role (admin) can insert/update billing records
-- No insert/update policies for authenticated users needed as they shouldn't create billing records directly.

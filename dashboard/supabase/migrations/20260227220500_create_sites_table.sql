-- Create SITES Table for the new static template approach
create table if not exists public.sites (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.profiles(id) not null,
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

-- RLS Policies
alter table public.sites enable row level security;

create policy "Users can view own site config" on public.sites for select using (auth.uid() = wedding_id);
create policy "Users can update own site config" on public.sites for update using (auth.uid() = wedding_id);
create policy "Users can insert own site config" on public.sites for insert with check (auth.uid() = wedding_id);

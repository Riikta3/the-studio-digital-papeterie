create table if not exists public.playlist_suggestions (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  guest_name text,
  tracks jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);

alter table public.playlist_suggestions enable row level security;

create policy "Owner can read playlist suggestions" on public.playlist_suggestions
  for select using (
    exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = auth.uid()
    )
  );

create policy "Public can insert playlist suggestions" on public.playlist_suggestions
  for insert with check (true);

create index playlist_suggestions_wedding_id_idx on public.playlist_suggestions(wedding_id);

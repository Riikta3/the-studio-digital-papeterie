-- The guestbook module: guests leave the couple a written message from the
-- invitation. Private by decision (2026-10-03): only the couple reads them,
-- in the dashboard; the invitation shows the form, never other guests' words.
--
-- Same shape and rules as `playlist_suggestions`: the public may insert (the
-- `wedding_id` foreign key rejects an id pointing nowhere), only the owner of
-- the wedding reads and deletes. The length checks bound what one request can
-- store; the server action trims and validates before it ever gets here.

create table if not exists public.guestbook_messages (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  guest_name text not null check (char_length(guest_name) between 1 and 80),
  message text not null check (char_length(message) between 1 and 1000),
  submitted_at timestamptz not null default now()
);

alter table public.guestbook_messages enable row level security;

create policy "Owner can read guestbook messages" on public.guestbook_messages
  for select using (
    exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = auth.uid()
    )
  );

create policy "Owner can delete guestbook messages" on public.guestbook_messages
  for delete using (
    exists (
      select 1 from public.weddings w
      where w.id = wedding_id and w.user_id = auth.uid()
    )
  );

create policy "Public can insert guestbook messages" on public.guestbook_messages
  for insert with check (true);

create index guestbook_messages_wedding_id_idx
  on public.guestbook_messages(wedding_id, submitted_at desc);

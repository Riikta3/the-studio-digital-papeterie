-- RSVP Responses from public invitation page
-- Stores submissions from guests who fill the RSVP form on the invitation site.
-- Intentionally separate from households/guests (admin-managed) to avoid conflicts.

create table public.rsvp_responses (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  name text not null,
  attendance boolean not null,
  guest_count integer not null default 0,
  dietary text,
  message text,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Only the wedding owner can read responses; public can insert (no auth required)
alter table public.rsvp_responses enable row level security;

create policy "Owner can read own rsvp responses"
  on public.rsvp_responses for select
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

create policy "Anyone can submit an rsvp response"
  on public.rsvp_responses for insert
  with check (true);

create index idx_rsvp_responses_wedding_id on public.rsvp_responses(wedding_id);

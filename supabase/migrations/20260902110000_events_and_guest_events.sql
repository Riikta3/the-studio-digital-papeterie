-- Multiple events per wedding (spec §7 / cahier §5).
--
-- Maps onto shared/types/invitation.ts: events -> WeddingEvent,
-- guest_events -> GuestEventStatus. guests.status is explicitly KEPT (per the
-- spec) and continues to mirror the main event's status, so existing screens
-- (/guests, /rsvp-responses, seating) keep working unchanged. Application code
-- is responsible for keeping guests.status in sync with the guest_events row
-- for the wedding's "wedding-day" event; this migration does not add a
-- trigger for that because the spec defers the write-wiring to a later step
-- ("a cabler apres validation du modele").

-- 1. EVENTS -------------------------------------------------------------------

create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  wedding_id uuid references public.weddings(id) on delete cascade not null,
  -- Fixed set from shared/types/invitation.ts EVENT_KEYS.
  key text check (key in ('welcome-dinner', 'wedding-day', 'brunch', 'party')) not null,
  name text not null,
  date date,
  -- Free text on purpose: the spec keeps the couple's own wording verbatim
  -- ("17h00", "17 h 00", "5pm") rather than forcing a time type.
  time text,
  address text,
  description text,
  dress_code text,
  position int default 0,
  -- A disabled event is invisible to guests and excluded from counts (per
  -- shared/types/invitation.ts WeddingEvent.enabled doc comment).
  enabled boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.events enable row level security;

create policy "Owner can manage own events"
  on public.events for all
  using (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.weddings where id = wedding_id and user_id = auth.uid())
  );

-- Guests: the Jour J / invitation guest pages render event details (date,
-- address, dress code) for enabled events only. No anon access to disabled
-- (draft) events.
create policy "Guests can read enabled events"
  on public.events for select
  to anon
  using (enabled = true);

create index if not exists idx_events_wedding_id on public.events(wedding_id);

-- 2. GUEST_EVENTS ---------------------------------------------------------------

create table if not exists public.guest_events (
  id uuid default gen_random_uuid() primary key,
  guest_id uuid references public.guests(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  status text check (status in ('pending', 'confirmed', 'declined')) default 'pending',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null,
  unique(guest_id, event_id)
);

alter table public.guest_events enable row level security;

-- Owner check goes through the guest's wedding_id, since guest_events has no
-- wedding_id column of its own — same reach-through pattern as menu_items.
create policy "Owner can manage own guest_events"
  on public.guest_events for all
  using (
    exists (
      select 1
      from public.guests g
      join public.weddings w on w.id = g.wedding_id
      where g.id = guest_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.guests g
      join public.weddings w on w.id = g.wedding_id
      where g.id = guest_id and w.user_id = auth.uid()
    )
  );

-- No anonymous access at all: per-guest, per-event RSVP status is exactly
-- the kind of data §16 forbids exposing to an unauthenticated guest page.
-- Public RSVP submission still goes through rsvp_responses / submit-rsvp.ts,
-- not this table.

create index if not exists idx_guest_events_guest_id on public.guest_events(guest_id);
create index if not exists idx_guest_events_event_id on public.guest_events(event_id);

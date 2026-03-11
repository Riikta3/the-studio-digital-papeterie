-- Add admin-editable fields to rsvp_responses
alter table public.rsvp_responses
  add column if not exists admin_note text,
  add column if not exists participants jsonb default '[]'::jsonb;

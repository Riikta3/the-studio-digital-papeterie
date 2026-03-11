-- Allow attendance to be null (= en attente / not yet confirmed)
-- null = en attente, true = confirmé, false = absent
alter table public.rsvp_responses
  alter column attendance drop not null,
  alter column attendance drop default;

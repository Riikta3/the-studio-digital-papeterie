-- Add `guests.relation_type`, a column the application has always written to
-- and which has never existed.
--
-- `AddHouseholdDialog` offers a relation for each guest (partner, spouse,
-- child, parent, sibling, grandparent, grandchild, family, friend, …), and
-- `guest-actions.ts` inserts it. Postgres rejected the insert every time with
-- "Could not find the 'relation_type' column of 'guests' in the schema cache",
-- so adding a household reported "Foyer créé mais erreur sur les invités" and
-- the guests were silently dropped — the couple got an empty household.
--
-- Deliberately free text rather than a CHECK constraint. The dashboard's own
-- list already carries ten values and the RSVP flow adds its own wording; a
-- constraint would have to be migrated every time the product adds a relation,
-- and rejecting a value at the database level here buys nothing — nothing
-- branches on it, it is displayed as a label.
alter table public.guests add column if not exists relation_type text;

comment on column public.guests.relation_type is
  'How this guest relates to the household contact (partner, child, friend, …). '
  'Free text: it is a display label, nothing branches on it, and the product''s '
  'list of relations grows without needing a migration.';

create index if not exists idx_guests_household_relation
  on public.guests(household_id, relation_type);

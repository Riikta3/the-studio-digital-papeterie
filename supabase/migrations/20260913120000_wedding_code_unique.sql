-- Migration: make a wedding code belong to exactly one wedding.
--
-- `settings.wedding_code` is what a guest types to reach their household on
-- the RSVP screen, and it had no constraint at all. The code was generated
-- from four letters of each first name plus the year, so every couple sharing
-- first names and a wedding year received the same one — four of the five
-- real weddings in production carried `TARI&CHAR2026`.
--
-- `resolve_wedding_code` matches on the code and takes `limit 1`, so a guest
-- typing a shared code reaches whichever row the planner returns first: a
-- stranger's guest list, and an RSVP filed against the wrong wedding.
--
-- Provisioning now draws a random suffix and checks it against existing codes
-- (see `generateWeddingCode` in landing/src/actions/create-wedding.ts), but
-- that check is a read followed by a write — two concurrent checkouts can both
-- find the same code free. This constraint is what actually makes it
-- impossible, and turns a silent collision into a failed insert we can see.
--
-- Case-insensitive, because `resolve_wedding_code` compares with
-- `upper(trim(...))`: without that, `abc` and `ABC` would satisfy a plain
-- unique index while resolving to the same wedding for a guest — exactly the
-- bug this closes, one fold away.
--
-- Nulls are allowed through: a wedding whose code has not been set yet is a
-- legitimate state, and Postgres treats each null as distinct in a unique
-- index anyway.

create unique index if not exists settings_wedding_code_unique
  on public.settings (upper(trim(wedding_code)))
  where wedding_code is not null;

comment on index public.settings_wedding_code_unique is
  'One wedding code, one wedding. Compared case- and whitespace-insensitively '
  'to match resolve_wedding_code, which upper(trim(...))s both sides — so a '
  'guest can never be routed to a wedding that merely differs by case.';

-- Add the two household columns the RSVP form has always collected.
--
-- `households.song_request` and `households.transportation` are declared in
-- `dashboard/src/types/index.ts:34-35` and rendered by the guest RSVP form
-- (`dashboard/src/app/[locale]/rsvp/page.tsx:546` and :559), but they were
-- never created: `full_db_reset.sql` defines households without them, and no
-- later migration adds them.
--
-- So every RSVP written by the old `updateHouseholdRsvp` failed with
-- `column "song_request" does not exist`. It went unnoticed because that code
-- ran on the service role and discarded the result — the household update's
-- error was returned but the guest updates were fired through `Promise.all`
-- with no error check at all, and the action answered `{ success: true }`
-- regardless. Guests have been typing song requests and travel details into a
-- form that silently dropped them.
--
-- Found by running the new `submit_rsvp_household` RPC against a seeded local
-- database: the RPC surfaces the error the previous code swallowed.
--
-- `transportation` is free text rather than a check constraint: the form posts
-- 'bus' and 'car' today (rsvp/page.tsx:559-571), but the couple-facing wording
-- is not fixed and a constraint here would turn a future label change into a
-- failed migration.

alter table public.households
  add column if not exists song_request text,
  add column if not exists transportation text;

comment on column public.households.song_request is
  'Song the household would like to hear, from the guest RSVP form.';

comment on column public.households.transportation is
  'How the household plans to travel (the form posts ''bus'' or ''car''). '
  'Free text on purpose: the options are wording, not a domain constraint.';

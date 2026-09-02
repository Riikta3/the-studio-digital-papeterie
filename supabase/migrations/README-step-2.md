# Step 2 — Day-of module & multi-event guests: operator notes

These five migrations back the Jour J dashboard and multi-event guest
management described in
`docs/superpowers/specs/2026-09-01-back-office-maries-jour-j-design.md`
(§6–§7). They were written, not applied — review, then apply in order.

## Order and contents

1. **`20260902100000_day_of_module.sql`**
   Creates `day_of_settings`, `menu_categories`, `menu_items`, `guest_media`.
   Adds `tables.seats_label` and `tables.position`. Owner RLS on all four new
   tables; anonymous `select` on `menu_categories`/`menu_items` gated by
   `day_of_settings.enabled`; anonymous `insert`/`select` on `guest_media`
   gated by `uploads_open_until` / `gallery_visible_to_guests` respectively.

2. **`20260902110000_events_and_guest_events.sql`**
   Creates `events` and `guest_events`. `guests.status` is untouched — it
   still mirrors the main event so `/guests`, `/rsvp-responses` and seating
   keep working without changes. No anonymous access on `guest_events` at
   all (per-guest RSVP status must not be exposed to the guest page).

3. **`20260902120000_invitation_content.sql`**
   Creates `schedule_entries`, `venues`, `accommodations`, `faq_entries`.
   Adds structured meal columns to `guests`: `meal`, `dietary_flags`,
   `allergies`, `notes`, `guest_group`. **`dietary_requirements` is kept**,
   not dropped — see "Decisions" below.

4. **`20260902130000_guest_table_search.sql`** — **the security-critical
   one.** Creates `search_guest_table(wedding_id, query)`, `security
   definer`, the only path an anonymous guest has into the guest list. See
   the warning below before touching it.

5. **`20260902140000_guest_media_storage.sql`**
   Creates the `guest-media` storage bucket (checked `public_storage_buckets.sql`
   and `media_storage.sql` first — neither already creates this bucket) with
   anonymous insert/select policies mirroring the `guest_media` table RLS,
   plus authenticated owner policies matching the `venue`/`videos`/`gallery`
   bucket pattern.

## What to check after applying

- `select * from information_schema.tables where table_schema = 'public' and
  table_name in ('day_of_settings','menu_categories','menu_items',
  'guest_media','events','guest_events','schedule_entries','venues',
  'accommodations','faq_entries');` — all 10 present.
- `select relrowsecurity from pg_class where relname = '<table>';` for each
  of the 10 — all `true`.
- `select proname, prosecdef from pg_proc where proname =
  'search_guest_table';` — `prosecdef` must be `true`.
- `select * from storage.buckets where id = 'guest-media';` — present,
  `public = true`, mime types include the four image types + three video
  types.
- As an anonymous (`anon` key) client: `search_guest_table(<real wedding
  id>, 'a')` returns zero rows (query too short);
  `search_guest_table(<real wedding id>, 'xx-no-such-guest')` returns zero
  rows; a 2+ char query matching a confirmed, seated guest returns at most 5
  rows with exactly the four expected columns.
- As an anonymous client: confirm `select * from guests` and `select * from
  guest_events` are both empty/denied (no anon policy exists on either).
- Run the app's own guest-facing Jour J flow once end to end (search, menu
  read, photo upload while a window is open) before considering step 2 done.

## Decisions made while writing these

- **`dietary_requirements` kept, not dropped.** The spec says dropping a
  column with live data is the user's call. A comment on the column in
  `20260902120000_invitation_content.sql` flags it as deprecated and
  proposes a backfill-then-drop follow-up once the dashboard writes the new
  columns exclusively.
- **Accent-insensitivity without `unaccent`.** No prior migration in this
  repo installs the `unaccent` extension, and adding a new extension
  dependency for a single RPC risked it not being enabled on the linked
  project. `search_guest_table` instead uses `lower()` plus an explicit
  `translate()` over the accented characters that occur in French names.
  This is narrower than `unaccent()` (covers French, not every diacritic in
  every language) — swap it for `unaccent()` later if broader coverage is
  needed; the function's signature and guarantees would not change.
- **`guests.status` untouched.** Per the spec, it keeps mirroring the main
  event's status. No trigger was added to sync it from `guest_events`
  automatically — the spec explicitly defers that wiring ("à câbler après
  validation du modèle"), so `guests.status` and `guest_events` can
  temporarily disagree until the application layer is wired in a later step.

## ⚠️ `search_guest_table` warning

`search_guest_table` is `security definer` and is the **entire** reason an
anonymous guest cannot enumerate the guest list from the public Jour J page
(cahier des charges §16). Do not modify its `where` clause, its column list,
its row limit, or its grants without re-reading §16 first. In particular:

- Never add `email`, `phone`, `status`, `id`, or `wedding_id` to its return
  columns.
- Never drop the `status = 'confirmed'` or `table_id is not null` filters.
- Never raise the `limit 5` or lower the 2-character minimum.
- Never grant `execute` more broadly than `anon, authenticated` (it is
  already revoked from `public`; keep it that way).

Any change to this function should be reviewed as carefully as an RLS policy
change — it functions as one.

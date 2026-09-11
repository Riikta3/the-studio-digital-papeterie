-- Cap how much a wedding's guests can upload.
--
-- `uploadGuestMedia` (landing/src/actions/guest-page-actions.ts:484) is
-- anonymous by design — it backs the QR page guests reach without an account —
-- and it bounds each file (100 Mo, MAX_UPLOAD_BYTES) and each call (10 files,
-- MAX_FILES_PER_CALL). Nothing bounded the total: 1 Go per call, repeated as
-- often as anyone likes for as long as the upload window is open, on a storage
-- bill the couple does not control.
--
-- The cap lives in the insert policy rather than in the action because the
-- anon key is public: a caller can insert into `guest_media` through PostgREST
-- without going near our code. Same reasoning as the rate limit in
-- 20260903110000, and as the RPCs in 20260911100000.
--
-- Counting rows rather than bytes: `guest_media` records no file size, and
-- adding one would mean trusting a number the client supplies. 3000 files is
-- far above a real wedding — a few hundred guests posting a handful each — and
-- low enough to bound the bill. The per-file limit in the action still caps
-- what one row can cost.
--
-- ── Why the count is a function, not a subquery ───────────────────────────
--
-- The first version of this migration put `(select count(*) from
-- public.guest_media …)` straight into the policy. Postgres evaluates that
-- subquery under the very policy being defined, so the first anonymous insert
-- failed with "infinite recursion detected in policy for relation
-- guest_media" — the guest upload path was broken outright, not merely capped.
--
-- A `security definer` function breaks the cycle: it runs with the owner's
-- rights, so its read of `guest_media` is not filtered by RLS and does not
-- re-enter the policy. Caught by inserting as `anon` against a local database;
-- the owner path never touches this policy and so never showed the fault.
--
-- ── The upload window needs the same treatment ────────────────────────────
--
-- The window check is `exists (select 1 from day_of_settings …)`, and that
-- read is itself filtered by RLS. It worked only because `day_of_settings`
-- had a broad anon select policy — the one dropped in 20260911110000, which
-- replaced it with an RPC because it let anyone enumerate every wedding. With
-- it gone the `exists` finds nothing under the `anon` role and every guest
-- upload is refused, quota or no quota.
--
-- So the window moves into a security-definer function too. Also caught by
-- the anon insert test: the policy looked correct in isolation and was broken
-- by a migration that never mentions guest_media.

/**
 * How many media rows a wedding already holds.
 *
 * `security definer` on purpose — see the note above. It returns a count and
 * nothing else, so it discloses no media to a caller who is allowed to invoke
 * it; it is not granted to anon regardless, since only the policy calls it.
 */
create or replace function public.guest_media_count(p_wedding_id uuid)
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select count(*) from public.guest_media where wedding_id = p_wedding_id;
$$;

comment on function public.guest_media_count(uuid) is
  'Row count for one wedding''s guest media, used by the anon insert policy. '
  'Security definer so the policy''s own read does not recurse into itself.';

revoke all on function public.guest_media_count(uuid) from public;

/**
 * Whether the couple's upload window is currently open.
 *
 * `security definer` so the policy can read `day_of_settings` without an anon
 * select policy on it — there is deliberately none any more (20260911110000).
 * Returns a single boolean about one wedding the caller already named, so it
 * reveals nothing that page could not already tell.
 */
create or replace function public.guest_uploads_open(p_wedding_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.day_of_settings ds
    where ds.wedding_id = p_wedding_id
      and ds.uploads_open_until is not null
      and ds.uploads_open_until > now()
  );
$$;

comment on function public.guest_uploads_open(uuid) is
  'True while a wedding accepts guest uploads. Security definer because the '
  'anon select policy on day_of_settings was replaced by an RPC, leaving the '
  'insert policy unable to read the window for itself.';

revoke all on function public.guest_uploads_open(uuid) from public;

drop policy if exists "Guests can upload media while the window is open" on public.guest_media;

create policy "Guests can upload media while the window is open"
  on public.guest_media for insert
  to anon
  with check (
    public.guest_uploads_open(guest_media.wedding_id)
    and public.guest_media_count(guest_media.wedding_id) < 3000
  );

comment on policy "Guests can upload media while the window is open" on public.guest_media is
  'Anonymous guest uploads, allowed only while the couple''s upload window is '
  'open and below 3000 files for the wedding. The count is here rather than in '
  'the server action because the anon key is public and PostgREST can be '
  'called directly. Owner uploads are governed by the owner policy and are '
  'not capped by this.';

-- The count above runs on every anonymous insert, so it needs an index rather
-- than a sequential scan of the whole table.
create index if not exists idx_guest_media_wedding_id
  on public.guest_media(wedding_id);

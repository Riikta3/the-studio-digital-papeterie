-- Make `guest-media` private, so hiding a photo actually un-shares it.
--
-- Found by the whole-branch review, and it is a hole no single screen shows:
--
--   * `20260902140000_guest_media_storage.sql` created the bucket with
--     `public => true`.
--   * The dashboard signs its URLs (correct, 1-hour TTL).
--   * The guest page served `getPublicUrl()` — a permanent, unsigned URL.
--
-- So a guest who opened the gallery held URLs that kept working forever. When
-- the couple hid an embarrassing photo, `setMediaHidden` flipped a boolean and
-- nothing else: every URL already handed out still resolved. And because the
-- bucket was public, `/object/public/...` bypasses `storage.objects` RLS
-- altogether, so even switching the whole gallery off did not close it.
--
-- The storage policy added in 140000 already admitted the gap in its own
-- comment: it can gate on `gallery_visible_to_guests` but "cannot see
-- per-file `hidden`". With a private bucket that no longer matters — access
-- runs through signed URLs whose lifetime the application controls, and a
-- hidden photo goes dark when its signature expires.
--
-- Flipping `public` does not move or rename a single object; only how they are
-- addressed changes. The application change lands with it: the guest page now
-- calls `createSignedUrl` like the dashboard already did.
update storage.buckets
set public = false
where id = 'guest-media';

-- No `comment on table storage.objects` here: that table belongs to the
-- storage extension and we are not its owner (SQLSTATE 42501). The reasoning
-- lives in this file's header and beside the signing code in
-- landing/src/actions/guest-page-actions.ts instead.

-- Allow WebP in the `venue` bucket.
--
-- Found in review: the photo upload accepts WebP in the browser
-- (`PhotoPicker`) and re-validates it server-side, but the bucket's own
-- allowed_mime_types was ['image/jpeg', 'image/jpg', 'image/png']. A WebP
-- therefore passed both checks and was then rejected by Storage, surfacing to
-- the couple as a generic "Erreur lors du téléversement de la photo." with
-- nothing to act on.
--
-- Widening the bucket rather than dropping WebP from the code, because:
--   * WebP is what phones and design tools export now, and a venue photo is
--     exactly the kind of file a couple will have in that format;
--   * `guest-media`, created in 20260902140000, already allows it — so the two
--     image buckets disagreed, and the guest-facing one was the more
--     permissive of the pair. This aligns them;
--   * the alternative is telling couples their photo is invalid when it is
--     not.
--
-- The 10 MB bucket limit is left alone: the application caps uploads at 8 MB,
-- so the bucket is not the binding constraint and loosening it would only
-- weaken a limit nothing is asking for.
update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]
where id = 'venue';

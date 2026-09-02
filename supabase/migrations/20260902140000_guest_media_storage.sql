-- Storage bucket for guest-uploaded Jour J media (spec §6, cahier §19/§21).
--
-- Built on the pattern already established in public_storage_buckets.sql and
-- media_storage.sql: bucket row + storage.objects policies. Checked both
-- files first - neither creates a 'guest-media' bucket, so this is new, not
-- a duplicate.
--
-- Unlike venue/videos/gallery (authenticated-owner upload, public read),
-- this bucket takes anonymous uploads from guests scanning the Jour J QR
-- code, so access is governed by public.day_of_settings instead of a simple
-- "owns the wedding" check - mirrored from the RLS policies added on
-- public.guest_media in 20260902100000_day_of_module.sql.
--
-- Object path convention: '<wedding_id>/<file>', same folder-per-wedding
-- convention as the other buckets, read via storage.foldername(name)[1].

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guest-media',
  'guest-media',
  true,
  104857600, -- 100MB: photos and short videos from a phone
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- Guests: insert only while that wedding's upload window is open. Mirrors
-- the "Guests can upload media while the window is open" policy on
-- public.guest_media - the DB row and the storage object should only ever
-- be writable under the same condition.
create policy "Guests can upload guest-media while the window is open"
on storage.objects for insert
to anon
with check (
  bucket_id = 'guest-media'
  and exists (
    select 1
    from public.day_of_settings ds
    where ds.wedding_id::text = (storage.foldername(name))[1]
      and ds.uploads_open_until is not null
      and ds.uploads_open_until > now()
  )
);

-- Guests: read only when that wedding's gallery is visible. This is a
-- coarser check than the guest_media table policy (it cannot see per-file
-- `hidden`, since that lives on the DB row, not the storage object) -
-- the app must always read the guest_media table first and only ever
-- request/display storage_path values for rows that already passed the
-- table's own hidden=false check. This policy exists so the storage layer
-- itself never becomes an open bucket when the gallery is off.
create policy "Guests can read guest-media when gallery is visible"
on storage.objects for select
to anon
using (
  bucket_id = 'guest-media'
  and exists (
    select 1
    from public.day_of_settings ds
    where ds.wedding_id::text = (storage.foldername(name))[1]
      and ds.gallery_visible_to_guests = true
  )
);

-- Couple: full control over their own wedding's folder, same idiom as the
-- venue/videos/gallery buckets (joins weddings -> profiles on auth.uid()).
create policy "Authenticated users can upload guest-media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'guest-media'
  and (storage.foldername(name))[1] in (
    select w.id::text from weddings w join profiles p on p.id = w.user_id where p.id = auth.uid()
  )
);

create policy "Authenticated users can read own guest-media"
on storage.objects for select
to authenticated
using (
  bucket_id = 'guest-media'
  and (storage.foldername(name))[1] in (
    select w.id::text from weddings w join profiles p on p.id = w.user_id where p.id = auth.uid()
  )
);

create policy "Authenticated users can delete own guest-media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'guest-media'
  and (storage.foldername(name))[1] in (
    select w.id::text from weddings w join profiles p on p.id = w.user_id where p.id = auth.uid()
  )
);

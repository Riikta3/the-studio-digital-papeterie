-- Bucket for venue/map photos (JPG, PNG, max 10MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'venue',
  'venue',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do nothing;

-- Bucket for intro videos (MP4, MOV, WebM, max 100MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  true,
  104857600, -- 100MB
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- Venue: authenticated upload to own wedding folder
create policy "Authenticated users can upload venue images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'venue'
  and (storage.foldername(name))[1] in (
    select w.id::text from weddings w join profiles p on p.id = w.user_id where p.id = auth.uid()
  )
);

create policy "Authenticated users can delete venue images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'venue'
  and (storage.foldername(name))[1] in (
    select w.id::text from weddings w join profiles p on p.id = w.user_id where p.id = auth.uid()
  )
);

create policy "Public can read venue images"
on storage.objects for select to public
using (bucket_id = 'venue');

-- Videos: authenticated upload to own wedding folder
create policy "Authenticated users can upload intro videos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] in (
    select w.id::text from weddings w join profiles p on p.id = w.user_id where p.id = auth.uid()
  )
);

create policy "Authenticated users can delete intro videos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] in (
    select w.id::text from weddings w join profiles p on p.id = w.user_id where p.id = auth.uid()
  )
);

create policy "Public can read intro videos"
on storage.objects for select to public
using (bucket_id = 'videos');

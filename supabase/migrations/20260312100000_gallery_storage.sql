-- Create gallery bucket for wedding photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gallery',
  'gallery',
  true,
  5242880, -- 5MB max per file
  array['image/jpeg', 'image/jpg', 'image/png']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload to their own wedding folder
create policy "Authenticated users can upload gallery images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'gallery'
  and (storage.foldername(name))[1] in (
    select w.id::text
    from weddings w
    join profiles p on p.id = w.user_id
    where p.id = auth.uid()
  )
);

-- Allow authenticated users to delete their own gallery images
create policy "Authenticated users can delete their gallery images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'gallery'
  and (storage.foldername(name))[1] in (
    select w.id::text
    from weddings w
    join profiles p on p.id = w.user_id
    where p.id = auth.uid()
  )
);

-- Public read access
create policy "Public can read gallery images"
on storage.objects for select
to public
using (bucket_id = 'gallery');

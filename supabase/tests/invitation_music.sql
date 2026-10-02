-- Checks for 20261002150000_invitation_music.sql. LOCAL database only:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -v ON_ERROR_STOP=1 -f supabase/tests/invitation_music.sql
-- Everything runs in one transaction that is rolled back: nothing stays behind.
begin;

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-00000000d001', 'music-paid@example.test', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-00000000d002', 'music-unpaid@example.test', 'authenticated', 'authenticated');
insert into public.profiles (id) values
  ('00000000-0000-4000-8000-00000000d001'),
  ('00000000-0000-4000-8000-00000000d002')
on conflict (id) do nothing;
insert into public.weddings (id, user_id) values
  ('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000d001'),
  ('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000d002');
insert into public.sites (id, wedding_id, slug, plan_id, theme_id, modules, extras, status) values
  ('00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000e001',
   'music-check-paid', 'signature', 'ciao-amore', '{}', array['custom-music'], 'published'),
  ('00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000e002',
   'music-check-unpaid', 'signature', 'ciao-amore', '{}', '{}', 'published');
-- Both couples filled the music columns. Only one of them paid for it.
insert into public.settings (wedding_id, music_track, music_upload_path) values
  ('00000000-0000-4000-8000-00000000e001', 'studio-default',
   '00000000-0000-4000-8000-00000000e001/1-notre-chanson.mp3'),
  ('00000000-0000-4000-8000-00000000e002', 'studio-default',
   '00000000-0000-4000-8000-00000000e002/1-notre-chanson.mp3')
on conflict (wedding_id) do update
  set music_track = excluded.music_track,
      music_upload_path = excluded.music_upload_path;

do $$
declare
  r record;
begin
  -- Paid, switch on (the column default): the couple's choice comes back.
  select * into r from public.resolve_public_slug('music-check-paid');
  assert r.music_enabled, 'paid site: music_enabled should be true';
  assert r.music_track = 'studio-default', format('paid site: music_track = %s', r.music_track);
  assert r.music_upload_path = '00000000-0000-4000-8000-00000000e001/1-notre-chanson.mp3',
    format('paid site: music_upload_path = %s', r.music_upload_path);

  -- Not paid, settings filled by hand: the invitation resolves, the music does not.
  select * into r from public.resolve_public_slug('music-check-unpaid');
  assert r.wedding_id is not null, 'unpaid site must still resolve';
  assert not r.music_enabled, 'unpaid site: music_enabled should be false';
  assert r.music_track is null and r.music_upload_path is null,
    'unpaid site leaked the music columns';

  -- Paid, switched off by the couple: nothing.
  update public.settings set music_enabled = false
   where wedding_id = '00000000-0000-4000-8000-00000000e001';
  select * into r from public.resolve_public_slug('music-check-paid');
  assert not r.music_enabled and r.music_track is null and r.music_upload_path is null,
    'switched-off site leaked the music columns';

  -- Unpublished: no row at all.
  update public.settings set music_enabled = true
   where wedding_id = '00000000-0000-4000-8000-00000000e001';
  update public.sites set status = 'draft'
   where id = '00000000-0000-4000-8000-00000000f001';
  perform 1 from public.resolve_public_slug('music-check-paid');
  assert not found, 'an unpublished site must not resolve';

  -- The bucket exists, public, with its limits.
  perform 1 from storage.buckets
   where id = 'music' and public and file_size_limit = 15728640
     and allowed_mime_types @> array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
  assert found, 'music bucket missing or misconfigured';

  -- Guests still reach the function.
  assert has_function_privilege('anon', 'public.resolve_public_slug(text)', 'execute'),
    'anon lost execute on resolve_public_slug';
end;
$$;

rollback;

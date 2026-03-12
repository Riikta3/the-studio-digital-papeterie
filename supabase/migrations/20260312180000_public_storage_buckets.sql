-- Make videos and venue storage buckets public (readable by anyone)
insert into storage.buckets (id, name, public)
values
  ('videos', 'videos', true),
  ('venue',  'venue',  true),
  ('gallery','gallery', true)
on conflict (id) do update set public = true;

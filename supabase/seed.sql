-- Local development seed — runs automatically after `supabase db reset`.
--
-- One complete wedding, as the product would have created it: bought through
-- the studio, provisioned by `createWedding` + `seedInvitationContent`, then
-- worked on for a while. Every screen in both apps has something real to show,
-- so a reset leaves a usable environment instead of empty tables.
--
-- ## How to use it
--
--   npx supabase db reset          -- rebuilds the schema and runs this
--
-- Then sign in to the dashboard as:
--
--   demo@studio.test  /  demo1234
--
-- and open the invitation at:
--
--   http://localhost:3010/fr/invitation/camille-et-jonas
--
-- ## Conventions
--
-- Fixed UUIDs, so a reset produces the same ids every time: a bookmarked
-- dashboard URL keeps working, and a failing query can be pasted between
-- sessions. They start `00000000-0000-00de-…` ("de" for demo) to be obviously
-- synthetic in a log.
--
-- Dates are computed from `now()` rather than written down. A hard-coded
-- wedding date silently goes stale — the countdown sticks at zero and the RSVP
-- deadline sits in the past — which makes the seed misleading exactly where a
-- developer would trust it.
--
-- Idempotent throughout (`on conflict do nothing`), so running it twice is
-- safe even though `db reset` always starts from an empty database.

-- ── Identity ────────────────────────────────────────────────────────────────

-- Password 'demo1234', bcrypt-hashed. `supabase db reset` provides pgcrypto,
-- so this is generated rather than a pasted hash nobody can verify.
-- The token columns are set to '' rather than left NULL. They are nullable in
-- the table, but GoTrue scans them into non-nullable Go strings when it looks
-- a user up, so a NULL makes every sign-in fail with "Database error querying
-- schema" — a 500 that says nothing about the real cause. Supabase's own user
-- creation writes empty strings for the same reason.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current, phone_change,
  phone_change_token, reauthentication_token
)
values (
  '00000000-0000-00de-0000-0000000000de',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'demo@studio.test',
  crypt('demo1234', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  '', '', '', '', '', '', '', ''
)
on conflict (id) do nothing;

-- Supabase requires a matching identity row for email sign-in to work.
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at,
  created_at, updated_at
)
values (
  '00000000-0000-00de-0000-0000000000df',
  '00000000-0000-00de-0000-0000000000de',
  '00000000-0000-00de-0000-0000000000de',
  '{"sub":"00000000-0000-00de-0000-0000000000de","email":"demo@studio.test","email_verified":true,"phone_verified":false}'::jsonb,
  'email', now(), now(), now()
)
on conflict (id) do nothing;

insert into public.profiles (id, first_name, last_name, partner_name)
values ('00000000-0000-00de-0000-0000000000de', 'Camille', 'Roux', 'Jonas')
on conflict (id) do nothing;

-- ── The wedding ─────────────────────────────────────────────────────────────
--
-- Eight months out: far enough that the RSVP deadline is still ahead, close
-- enough that the countdown reads in days rather than years.

insert into public.weddings (id, user_id, wedding_date, partner_name)
values (
  '00000000-0000-00de-0000-000000000001',
  '00000000-0000-00de-0000-0000000000de',
  (current_date + interval '8 months')::date,
  'Jonas'
)
on conflict (id) do nothing;

insert into public.settings (wedding_id, wedding_code, guest_code, adults_only)
values ('00000000-0000-00de-0000-000000000001', 'CAMILLE-JONAS', 'AMORE', false)
on conflict (wedding_id) do nothing;

-- `status = 'published'` is what makes the invitation answer at its slug —
-- separate from the Jour J module below (migration 20260912110000).
insert into public.sites (
  wedding_id, plan_id, theme_id, modules, languages, extras,
  animation_id, slug, status
)
values (
  '00000000-0000-00de-0000-000000000001',
  'signature', 'ciao-amore',
  '{countdown,timeline,dress-code,map,accommodation,playlist,faq,rsvp}',
  '{fr}', '{}', 'envelope-classic',
  'camille-et-jonas', 'published'
)
on conflict (wedding_id) do nothing;

insert into public.site_modules (site_id, module_id, position)
select s.id, m.module_id, m.position
from public.sites s
cross join (values
  ('countdown', 1), ('timeline', 2), ('dress-code', 3), ('map', 4),
  ('accommodation', 5), ('playlist', 6), ('faq', 7), ('rsvp', 8)
) as m(module_id, position)
where s.wedding_id = '00000000-0000-00de-0000-000000000001'
on conflict do nothing;

-- Jour J left OFF on purpose: it is the guest page for the day itself, and a
-- couple turns it on deliberately. Having it off here also keeps the seed
-- honest about the two switches being independent — the invitation above is
-- published regardless.
insert into public.day_of_settings (wedding_id, enabled, gallery_visible_to_guests)
values ('00000000-0000-00de-0000-000000000001', false, false)
on conflict (wedding_id) do nothing;

-- ── Events ──────────────────────────────────────────────────────────────────

insert into public.events (id, wedding_id, key, name, date, "time", address, description, dress_code, position, enabled)
values
  ('00000000-0000-00de-0000-000000000010', '00000000-0000-00de-0000-000000000001',
   'welcome-dinner', 'Dîner de bienvenue',
   (current_date + interval '8 months' - interval '1 day')::date,
   '19 h 30', 'Le Petit Comptoir · Uzès',
   'Pour ceux qui arrivent la veille.', null, 1, true),

  ('00000000-0000-00de-0000-000000000011', '00000000-0000-00de-0000-000000000001',
   'wedding-day', 'Notre mariage',
   (current_date + interval '8 months')::date,
   '16 h 00', 'Domaine des Hauts Vents', null, 'Tenue de fête', 2, true),

  ('00000000-0000-00de-0000-000000000012', '00000000-0000-00de-0000-000000000001',
   'brunch', 'Brunch',
   (current_date + interval '8 months' + interval '1 day')::date,
   '11 h 00', 'Domaine des Hauts Vents',
   'On prolonge autour d''un brunch au soleil.', null, 3, true)
on conflict (id) do nothing;

-- ── Invitation content ──────────────────────────────────────────────────────

insert into public.schedule_entries (wedding_id, event_id, "time", title, description, position)
values
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000011', '16 h 00', 'Cérémonie',    'Le moment que nous attendons tous.', 1),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000011', '17 h 00', 'Cocktail',     'Le temps de trinquer et de se retrouver.', 2),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000011', '19 h 30', 'Dîner',        'À table, tous ensemble.', 3),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000011', '22 h 30', 'Soirée dansante', 'La fête commence.', 4),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000012', '11 h 00', 'Brunch',       'Viennoiseries et grasse matinée pardonnée.', 5)
on conflict do nothing;

insert into public.venues (wedding_id, name, address, city, maps_url, transport_info, parking_info, access_info)
values (
  '00000000-0000-00de-0000-000000000001',
  'Domaine des Hauts Vents',
  '1250 chemin des Vignes', 'Uzès',
  'https://maps.google.com/?q=Uz%C3%A8s',
  E'Gare d''Avignon TGV à 40 min\nNavette depuis la gare à 14 h 30',
  'Parking gratuit sur place, 80 places.',
  'Portail blanc au bout du chemin, suivez les lanternes.'
)
on conflict (wedding_id) do nothing;

insert into public.accommodations (wedding_id, name, city, distance, phone, booking_url, offer, position)
values
  ('00000000-0000-00de-0000-000000000001', 'Hôtel du Parc',   'Uzès', 'à 5 min du domaine',  '+33 4 66 00 00 01', 'https://example.test/hotel-du-parc',  'Code CAMILLEJONAS : -10 %', 1),
  ('00000000-0000-00de-0000-000000000001', 'Mas des Oliviers','Uzès', 'à 12 min du domaine', '+33 4 66 00 00 02', 'https://example.test/mas-des-oliviers', null, 2),
  ('00000000-0000-00de-0000-000000000001', 'Le Clos Fleuri',  'Arpaillargues', 'à 15 min',    null,               'https://example.test/le-clos-fleuri', null, 3)
on conflict do nothing;

insert into public.faq_entries (wedding_id, question, answer, position, published)
values
  ('00000000-0000-00de-0000-000000000001', 'Puis-je venir accompagné ?',
   'Votre invitation précise le nombre de personnes attendues. En cas de doute, écrivez-nous.', 1, true),
  ('00000000-0000-00de-0000-000000000001', 'À quelle heure faut-il arriver ?',
   'Nous vous attendons un peu avant 15 h 30, afin que la cérémonie puisse commencer à l''heure.', 2, true),
  ('00000000-0000-00de-0000-000000000001', 'Y a-t-il un parking ?',
   'Oui, un parking gratuit de 80 places se trouve à l''entrée du domaine.', 3, true),
  -- Unpublished on purpose: the dashboard's FAQ screen needs both states to be
  -- worth looking at, and the invitation must not show this one.
  ('00000000-0000-00de-0000-000000000001', 'Brouillon — peut-on dormir sur place ?',
   'À compléter.', 4, false)
on conflict do nothing;

-- ── Guests ──────────────────────────────────────────────────────────────────
--
-- A deliberate spread of statuses: the guest list, the RSVP screens and the
-- dashboard counters are only readable when the numbers are not all the same.

insert into public.households (id, wedding_id, name, source, email, phone, status, guest_group, song_request)
values
  ('00000000-0000-00de-0000-000000000020', '00000000-0000-00de-0000-000000000001', 'Famille Roux',    'admin', 'roux@example.test',    '+33 6 00 00 00 01', 'confirmed', 'family',     'MIKA — Elle me dit'),
  ('00000000-0000-00de-0000-000000000021', '00000000-0000-00de-0000-000000000001', 'Famille Lefèvre', 'admin', 'lefevre@example.test', '+33 6 00 00 00 02', 'partial',   'family',     null),
  ('00000000-0000-00de-0000-000000000022', '00000000-0000-00de-0000-000000000001', 'Léa & Thomas',    'admin', 'lea@example.test',     null,                'pending',   'friends',    null),
  ('00000000-0000-00de-0000-000000000023', '00000000-0000-00de-0000-000000000001', 'Bureau Paris',    'admin', 'bureau@example.test',  null,                'declined',  'colleagues', null)
on conflict (id) do nothing;

insert into public.guests (wedding_id, household_id, first_name, last_name, email, status, meal, guest_group, relation_type, is_child, allergies)
values
  -- Famille Roux — confirmed, including a child and an allergy
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000020', 'Michel',  'Roux',    'michel@example.test', 'confirmed', 'standard',   'family', 'parent',  false, null),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000020', 'Hélène',  'Roux',    null,                  'confirmed', 'vegetarian', 'family', 'parent',  false, 'Sans gluten'),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000020', 'Noé',     'Roux',    null,                  'confirmed', 'child',      'family', 'sibling', true,  null),
  -- Famille Lefèvre — one in, one still deciding
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000021', 'Sophie',  'Lefèvre', null,                  'confirmed', 'standard',   'family', 'cousin',  false, null),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000021', 'Paul',    'Lefèvre', null,                  'pending',   'standard',   'family', 'cousin',  false, null),
  -- Friends — no answer yet
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000022', 'Léa',     'Bernard', null,                  'pending',   'vegan',      'friends', 'friend', false, null),
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000022', 'Thomas',  'Bernard', null,                  'pending',   'standard',   'friends', 'friend', false, null),
  -- Colleague — declined
  ('00000000-0000-00de-0000-000000000001', '00000000-0000-00de-0000-000000000023', 'Karim',   'Haddad',  null,                  'declined',  'standard',   'colleagues', 'colleague', false, null)
on conflict do nothing;

-- ── Seating ─────────────────────────────────────────────────────────────────

insert into public.tables (wedding_id, name, shape, capacity, seats_label, position)
values
  ('00000000-0000-00de-0000-000000000001', 'Table des mariés', 'rectangle', 8,  'Honneur', 1),
  ('00000000-0000-00de-0000-000000000001', 'Table 1',          'round',     10, null,      2),
  ('00000000-0000-00de-0000-000000000001', 'Table 2',          'round',     10, null,      3)
on conflict do nothing;

-- ── Guest submissions ───────────────────────────────────────────────────────
--
-- What guests have sent back. These reach the dashboard's RSVP and playlist
-- screens, which are otherwise empty on a fresh database.

insert into public.rsvp_responses (wedding_id, name, attendance, guest_count, dietary, message, respondent_first_name, respondent_last_name)
values
  ('00000000-0000-00de-0000-000000000001', 'Michel Roux',  true,  3, 'Un sans gluten',   'On a hâte ! Bravo à vous deux.', 'Michel', 'Roux'),
  ('00000000-0000-00de-0000-000000000001', 'Sophie Lefèvre', true, 1, null,              null,                             'Sophie', 'Lefèvre'),
  ('00000000-0000-00de-0000-000000000001', 'Karim Haddad', false, 0, null,               'Désolé, je serai à l''étranger. Plein de bonheur !', 'Karim', 'Haddad')
on conflict do nothing;

insert into public.playlist_suggestions (wedding_id, guest_name, tracks)
values
  ('00000000-0000-00de-0000-000000000001', 'Michel Roux',
   '[{"title":"Dreams","artist":"Fleetwood Mac"},{"title":"Septembre","artist":"Earth, Wind & Fire"}]'::jsonb),
  ('00000000-0000-00de-0000-000000000001', 'Léa Bernard',
   '[{"title":"Can''t Take My Eyes Off You","artist":"Boys Town Gang"}]'::jsonb)
on conflict do nothing;

-- ── Menu (Jour J) ───────────────────────────────────────────────────────────

insert into public.menu_categories (id, wedding_id, key, enabled, position)
values
  ('00000000-0000-00de-0000-000000000030', '00000000-0000-00de-0000-000000000001', 'cocktail', true, 1),
  ('00000000-0000-00de-0000-000000000031', '00000000-0000-00de-0000-000000000001', 'starter',  true, 2),
  ('00000000-0000-00de-0000-000000000032', '00000000-0000-00de-0000-000000000001', 'main',     true, 3),
  ('00000000-0000-00de-0000-000000000033', '00000000-0000-00de-0000-000000000001', 'dessert',  true, 4)
on conflict (id) do nothing;

insert into public.menu_items (category_id, name, description, variant, position)
values
  ('00000000-0000-00de-0000-000000000030', 'Gougères au comté',        null,                              null,         1),
  ('00000000-0000-00de-0000-000000000030', 'Légumes croquants',        'Houmous maison',                  'veggie',     2),
  ('00000000-0000-00de-0000-000000000031', 'Velouté de courge',        'Éclats de noisette',              'veggie',     1),
  ('00000000-0000-00de-0000-000000000032', 'Filet de bœuf',            'Gratin dauphinois',               'classic',    1),
  ('00000000-0000-00de-0000-000000000032', 'Risotto aux champignons',  null,                              'veggie',     2),
  ('00000000-0000-00de-0000-000000000033', 'Pièce montée',             'Choux vanille et caramel',        null,         1)
on conflict do nothing;

do $$
begin
  raise notice 'Seed: wedding "Camille & Jonas" ready.';
  raise notice '  dashboard  -> demo@studio.test / demo1234';
  raise notice '  invitation -> /fr/invitation/camille-et-jonas';
end $$;

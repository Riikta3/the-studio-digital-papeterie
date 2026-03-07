-- ⚠️ INSTRUCTIONS :
-- 1. Créez d'abord un utilisateur dans Supabase Dashboard > Authentication > Add User.
-- 2. Copiez son "User UUID" (ex: "a0eebc99-9c0b...").
-- 3. Remplacez 'VOTRE_UUID_ICI' ci-dessous par cet UUID.
-- 4. Exécutez ce script dans Supabase > SQL Editor pour avoir des données de test robustes.

DO $$
DECLARE
  -- REMPLACEZ JUSTE ICI 👇
  target_user_id uuid := 'VOTRE_UUID_ICI'; 
  
  -- Variables internes
  new_wedding_id uuid;
  new_household_id uuid;
BEGIN
  -- 1. Création du Profil Utilisateur
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    target_user_id,
    'Sophie',
    'Martin'
  )
  ON CONFLICT (id) DO UPDATE 
  SET first_name = EXCLUDED.first_name;

  -- 2. Création d'un événement "Mariage" affilié
  INSERT INTO public.weddings (user_id, partner_name, wedding_date)
  VALUES (
    target_user_id,
    'Marc',
    '2026-08-24'
  )
  RETURNING id INTO new_wedding_id;

  -- 3. Création du Site
  INSERT INTO public.sites (wedding_id, plan_id, theme_id, modules, languages)
  VALUES (
    new_wedding_id,
    'essential',
    'theme-1',
    '{rsvp,gallery}',
    '{fr}'
  );

  -- 4. Configuration (Settings)
  INSERT INTO public.settings (wedding_id, wedding_code, is_module_rsvp_meal_enabled, is_module_schedule_enabled)
  VALUES (
    new_wedding_id,
    'SOPHIE2026',
    true,
    true
  )
  ON CONFLICT (wedding_id) DO NOTHING;

  -- 5. Ajout d'un Foyer Test (Famille Dupont)
  INSERT INTO public.households (wedding_id, name, email, status)
  VALUES (
    new_wedding_id,
    'Famille Dupont',
    'jean.dupont@test.com',
    'pending'
  )
  RETURNING id INTO new_household_id;

  -- 6. Ajout des Invités dans ce Foyer
  INSERT INTO public.guests (wedding_id, household_id, first_name, last_name, email, status)
  VALUES 
  (new_wedding_id, new_household_id, 'Jean', 'Dupont', 'jean.dupont@test.com', 'pending'),
  (new_wedding_id, new_household_id, 'Marie', 'Dupont', null, 'pending');

  RAISE NOTICE '✅ Données de test créées pour l''utilisateur %, Mariage ID: %', target_user_id, new_wedding_id;

END $$;

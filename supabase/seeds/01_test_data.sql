-- ⚠️ INSTRUCTIONS :
-- 1. Créez d'abord un utilisateur dans Supabase Dashboard > Authentication > Add User.
-- 2. Copiez son "User UUID" (ex: "a0eebc99-9c0b...").
-- 3. Remplacez 'VOTRE_UUID_ICI' ci-dessous par cet UUID.
-- 4. Exécutez ce script dans Supabase > SQL Editor.

DO $$
DECLARE
  -- REMPLACEZ JUSTE ICI 👇
  target_user_id uuid := 'VOTRE_UUID_ICI'; 
  
  -- Variables internes
  wedding_profile_id uuid;
  household_id uuid;
BEGIN

  -- 1. Création du Profil Mariage
  INSERT INTO public.profiles (id, first_name, last_name, partner_name, wedding_date)
  VALUES (
    target_user_id,
    'Sophie',
    'Martin',
    'Marc',
    '2026-08-24'
  )
  ON CONFLICT (id) DO UPDATE 
  SET first_name = EXCLUDED.first_name; -- Evite erreur si existe déjà

  -- 2. Configuration (Settings)
  INSERT INTO public.settings (wedding_id, wedding_code, is_module_rsvp_meal_enabled, is_module_schedule_enabled)
  VALUES (
    target_user_id,
    'SOPHIE2026',
    true,
    true
  )
  ON CONFLICT (wedding_id) DO NOTHING;

  -- 3. Ajout d'un Foyer Test (Famille Dupont)
  INSERT INTO public.households (wedding_id, name, email, status, guest_count_display_only)
  VALUES (
    target_user_id,
    'Famille Dupont',
    'jean.dupont@test.com',
    'pending', 
    null -- (Note: guest_count_display_only n'existe pas, on compte les lignes guests)
  )
  RETURNING id INTO household_id;

  -- 4. Ajout des Invités dans ce Foyer
  INSERT INTO public.guests (wedding_id, household_id, first_name, last_name, email, status)
  VALUES 
  (target_user_id, household_id, 'Jean', 'Dupont', 'jean.dupont@test.com', 'pending'),
  (target_user_id, household_id, 'Marie', 'Dupont', null, 'pending');

  RAISE NOTICE '✅ Données de test créées pour l''utilisateur %', target_user_id;

END $$;

-- Run this in your Supabase SQL Editor
-- This script will create a dummy profile, settings, and site for testing the invitation viewer.
-- Note: We can't easily insert into auth.users via simple SQL without hashing passwords, 
-- but for testing the frontend route, we just need a valid UUID in our public tables.

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
  wedding_code text := 'SOPH&THOM2026TEST';
BEGIN
  -- 1. Create a mock profile
  INSERT INTO public.profiles (id, first_name, last_name, partner_name, wedding_date)
  VALUES (new_user_id, 'Sophie', 'Test', 'Thomas', '2026-06-15');

  -- 2. Create the settings with the unique wedding code
  INSERT INTO public.settings (wedding_id, wedding_code)
  VALUES (new_user_id, wedding_code);

  -- 3. Create the mocked Site Configuration (This is the new feature!)
  INSERT INTO public.sites (wedding_id, plan_id, theme_id, modules, languages)
  VALUES (
    new_user_id, 
    'premium', 
    'floral', 
    ARRAY['timeline', 'rsvp', 'gallery', 'map', 'gift-list', 'guestbook', 'accommodation', 'transport', 'menu', 'video-guestbook'], 
    ARRAY['fr', 'en']
  );

  RAISE NOTICE 'Test user created! Wedding Code: %', wedding_code;
END $$;

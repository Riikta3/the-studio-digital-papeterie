-- Add ON DELETE CASCADE to foreign keys referencing public.profiles (which is 1:1 with auth.users)

-- 1. Households -> Profiles
ALTER TABLE public.households
DROP CONSTRAINT IF EXISTS households_wedding_id_fkey;

ALTER TABLE public.households
ADD CONSTRAINT households_wedding_id_fkey
FOREIGN KEY (wedding_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 2. Guests -> Profiles (wedding_id)
ALTER TABLE public.guests
DROP CONSTRAINT IF EXISTS guests_wedding_id_fkey;

ALTER TABLE public.guests
ADD CONSTRAINT guests_wedding_id_fkey
FOREIGN KEY (wedding_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 3. Settings -> Profiles
ALTER TABLE public.settings
DROP CONSTRAINT IF EXISTS settings_wedding_id_fkey;

ALTER TABLE public.settings
ADD CONSTRAINT settings_wedding_id_fkey
FOREIGN KEY (wedding_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 4. Tables -> Profiles
ALTER TABLE public.tables
DROP CONSTRAINT IF EXISTS tables_wedding_id_fkey;

ALTER TABLE public.tables
ADD CONSTRAINT tables_wedding_id_fkey
FOREIGN KEY (wedding_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- 5. Profiles -> Auth.Users (Ensure profile is deleted when user is deleted)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

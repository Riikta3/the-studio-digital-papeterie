-- Seed file for local development
-- This file is executed after migrations when running 'supabase db reset'

-- NOTE: We are removing the manual USER_UUID check for the local seed
-- as the local environment starts fresh and usually doesn't have the same UUIDs
-- as production unless specifically linked.

-- We use DO block to handle errors gracefully if needed
DO $$
BEGIN
  RAISE NOTICE 'Skipping seed because of environment mismatch or manual user requirement.';
END $$;

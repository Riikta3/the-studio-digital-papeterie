-- Ensure 'source' column exists (Safety check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'households' AND column_name = 'source') THEN
        ALTER TABLE public.households ADD COLUMN source text check (source in ('admin', 'public')) default 'admin';
    END IF;
END $$;

-- Explicitly notify PostgREST to reload the schema cache
-- This is often needed when columns are added but the API doesn't see them immediately
NOTIFY pgrst, 'reload schema';

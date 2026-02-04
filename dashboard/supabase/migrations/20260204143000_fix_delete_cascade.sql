-- Drop the existing foreign key constraint
ALTER TABLE public.guests
DROP CONSTRAINT IF EXISTS guests_household_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE public.guests
ADD CONSTRAINT guests_household_id_fkey
FOREIGN KEY (household_id)
REFERENCES public.households (id)
ON DELETE CASCADE;

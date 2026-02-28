-- Create a table for Timeline Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wedding_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    time TEXT NOT NULL,          -- e.g. "14:30"
    title TEXT NOT NULL,         -- e.g. "Cérémonie Religieuse"
    location TEXT,               -- e.g. "Église Sainte-Marie"
    description TEXT,            -- e.g. "Merci d'arriver 15 minutes en avance."
    order_index INTEGER NOT NULL DEFAULT 0, -- To ensure they display in the correct chronological order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read events for a wedding (for public invitations)
CREATE POLICY "Enable read access for all users" ON public.events
    FOR SELECT USING (true);

-- Policy: Only authenticated users can insert/update/delete their own events (will refine later if needed for dashboard)
CREATE POLICY "Enable all access for authenticated users managing their weddings" ON public.events
    FOR ALL USING (auth.uid() = wedding_id);

-- Create an index to quickly pull a wedding's events ordered by their sequence
CREATE INDEX IF NOT EXISTS events_wedding_id_order_idx ON public.events (wedding_id, order_index);

-- Example Data for the Test User
-- Note: Replace the UUID below with test_wedding5's wedding_id if you want to seed it immediately.
-- Otherwise, you can just run the table creation part.
DO $$
DECLARE
  -- Finding the ID of our test user
  target_wedding_id uuid;
BEGIN
  SELECT wedding_id INTO target_wedding_id FROM public.settings WHERE wedding_code = 'SOPH&THOM2026TEST4' LIMIT 1;

  IF target_wedding_id IS NOT NULL THEN
    -- Delete old mock data to strictly reseed
    DELETE FROM public.events WHERE wedding_id = target_wedding_id;

    -- Insert mock events
    INSERT INTO public.events (wedding_id, time, title, location, description, order_index)
    VALUES 
      (target_wedding_id, '14:30', 'Cérémonie Religieuse', 'Église Sainte-Marie', 'Merci d''arriver 15 minutes en avance pour vous installer confortablement.', 1),
      (target_wedding_id, '17:00', 'Vin d''Honneur', 'Château de la Roche', 'Cocktails, champagne et petits fours dans les jardins du domaine.', 2),
      (target_wedding_id, '20:00', 'Dîner & Soirée', 'Salle des Fêtes du Château', 'Préparez-vous à déguster un repas d''exception et à danser jusqu''au bout de la nuit !', 3);
      
    RAISE NOTICE 'Test events seeded for user SOPH&THOM2026TEST4';
  END IF;
END $$;

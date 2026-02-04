-- Migration: Add RSVP specific fields to Households and Guests

-- 1. Add fields to HOUSEHOLDS
do $$ 
begin 
  -- Song Request (Artist - Song Name)
  if not exists (select 1 from information_schema.columns where table_name='households' and column_name='song_request') then
    alter table public.households add column song_request text;
  end if;

  -- Transportation (Bus vs Car)
  if not exists (select 1 from information_schema.columns where table_name='households' and column_name='transportation') then
    alter table public.households add column transportation text; 
    -- We keep it text to allow 'bus', 'car', 'none', etc. without strict enum constraint linking to code changes immediately
  end if;
end $$;


-- 2. Add fields to GUESTS (Detailed Dietary)
do $$ 
begin 
  -- dietary_requirements already exists (intended for checkboxes like 'vegetarian', 'gluten_free')
  
  -- Add a specific column for detailed notes if "Other" is selected or for specific allergy details
  if not exists (select 1 from information_schema.columns where table_name='guests' and column_name='dietary_details') then
    alter table public.guests add column dietary_details text;
  end if;
  
  -- Add specific 'is_attending' explicit status per guest if needed, 
  -- but 'status' (pending/confirmed/declined) on guest table already covers it.
end $$;

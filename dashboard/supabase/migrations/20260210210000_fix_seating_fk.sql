-- Fix: Add Foreign Key for Seating Plan
-- This allows Supabase to infer the relationship between tables and guests

do $$ 
begin 
  -- Check if constraint exists, if not add it
  if not exists (
      select 1 
      from information_schema.table_constraints 
      where constraint_name = 'fk_guests_table' 
      and table_name = 'guests'
  ) then
    alter table public.guests 
    add constraint fk_guests_table 
    foreign key (table_id) 
    references public.tables(id)
    on delete set null; -- If table is deleted, guests become unassigned (good UX)
  end if;
end $$;

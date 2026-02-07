-- Ensure rsvp_mode column exists
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name='settings' and column_name='rsvp_mode') then
    alter table public.settings add column rsvp_mode text check (rsvp_mode in ('open', 'closed')) default 'closed';
  end if;
end $$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

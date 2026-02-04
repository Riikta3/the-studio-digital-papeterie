-- Migration: Fix permissions for public schema
-- This is necessary if the default grants were lost or not applied correctly.

-- Grant usage on the schema itself
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Grant access to all tables (RLS will still enforce row-level security)
grant all on all tables in schema public to postgres, anon, authenticated, service_role;

-- Grant access to all sequences (for auto-increment ids if any, mostly gen_random_uuid used but good practice)
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;

-- Grant access to all routines (functions)
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

-- Ensure future tables get these grants automatically
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role;

-- Grant permissions on schema public to service_role (Admin API)
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

-- Ensure postgres (superuser) has access too
grant usage on schema public to postgres;
grant all on all tables in schema public to postgres;
grant all on all sequences in schema public to postgres;
grant all on all routines in schema public to postgres;

-- Make sure future tables are also accessible
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on routines to service_role;

alter default privileges in schema public grant all on tables to postgres;
alter default privileges in schema public grant all on sequences to postgres;
alter default privileges in schema public grant all on routines to postgres;

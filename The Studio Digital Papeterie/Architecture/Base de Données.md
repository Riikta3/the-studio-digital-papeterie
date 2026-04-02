# Base de Données — Supabase

## Tables
 profiles, weddings, sites, settings, site_modules, households, guests, tables, purchases, billing, rsvp_responses

## Clients
- client.ts — Browser
- server.ts — SSR / Server Components
- supabase-admin.ts — SERVICE_ROLE, bypass RLS

## Migrations
- 00000000000000_full_db_reset.sql
- 20260308110000_module_ordering.sql
- 20260308130000_add_slug_to_sites.sql
- 20260311120000_add_rsvp_responses.sql
- 20260311130000_rsvp_responses_admin_fields.sql
- 20260311140000_rsvp_respondent_name_split.sql
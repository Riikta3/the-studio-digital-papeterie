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

## Facturation (2026-09-10)

- `invoices` — une facture par vente. `stripe_payment_intent_id` **unique** (idempotence : un rejeu Stripe ne rebrûle pas de numéro). Montants en centimes. `line_items` jsonb gelé à l'émission, `pdf_path` pointe vers le bucket privé.
- `invoice_counters` — un compteur par année. Alimente `next_invoice_number()`.
- `next_invoice_number()` — allocation **atomique** (`insert … on conflict do update`, verrou de ligne). Obligation légale : séquence sans trou, art. 242 nonies A annexe II CGI. Un `max+1` applicatif produirait des doublons sous concurrence.
- Bucket storage `invoices` — **privé**, clé `<user_id>/<numéro>.pdf`, accès par URL signée 60 s.

Voir [[Provisioning et Facturation]].
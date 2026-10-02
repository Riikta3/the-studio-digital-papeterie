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
## Éditeur de faire-part (2026-09-27)

Migration `20260927120000_invitation_editor.sql`. Voir [[Éditeur de faire-part]].
**Appliquée en prod le 28/09/2026** (`supabase db push`), avant le merge du
code : voir [[Colonne invitation_texts absente en prod]].

- `settings.invitation_texts` jsonb (objet, `{}` par défaut) — une table plate
  `{ clé: texte }` : copie du contrat sans colonne (`copy.scheduleIntro`,
  `copy.footerNote`, `couple.monogram`, `dayTwo.note`…) et **mots du thème**
  (`faq.title`, `timeline.ribbon`…). Lue et écrite uniquement via
  `shared/data/invitation-texts.ts` (clés validées, valeurs coupées, 120 clés
  max). Clé absente = texte par défaut du thème.
- `schedule_entries.icon` (check : ceremony, cocktail, dinner, party, brunch)
  et `schedule_entries.image_url`.
- `accommodations.address` et `accommodations.secondary` (derrière « voir plus
  d'options »).
- `resolve_public_slug` renvoie `invitation_texts` et **de nouveau `languages`**,
  perdue par 20260912140000.

Un seul écrivain par fait : l'éditeur écrit les tables (`venues`,
`schedule_entries`, `accommodations`, `faq_entries`) ; les doublons dans
`site_modules.config` restent lus en secours et ne sont plus écrits.
`weddings.wedding_date` est tenue alignée sur la date de l'événement
`wedding-day` à chaque enregistrement (le compte à rebours du dashboard la lit).

## Achat de modules après la commande (migration `20260928120000_module_addons.sql`, 28/09/2026)

> Appliquée **en local uniquement**. La prod attend le feu vert (`db push`).

- `sites.pending_modules text[]` : modules ajoutés dans l'éditeur, enregistrés, **pas encore payés**. Invisibles des invités. Le couple peut l'écrire, mais rien n'y est affiché ni octroyé sans paiement.
- `purchases.stripe_payment_intent_id` + index unique `(stripe_payment_intent_id, item_id)`. `price_paid` est en **centimes**, 0 pour un module inclus.
- `grant_modules(site, modules[], payment_intent?, unit_price_cents?)` : seule porte vers `sites.modules` après la vente. `security definer`, réservée au service role, idempotente par PaymentIntent (un rejeu renvoie les mêmes modules, dans l'ordre demandé).
- Droits : `authenticated` ne peut plus modifier que `sites.status` et `sites.pending_modules` ; la policy d'insertion sur `sites` est supprimée. Avant, un couple pouvait s'offrir tous les modules ou changer de `plan_id` par l'API.
- `public_module_configs` ne renvoie plus que les modules présents dans `sites.modules`.
- Vérifications : `supabase/tests/module_addons.sql`, en local et en transaction annulée.

Voir [[Achat de modules]].

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


## Musique du faire-part (2026-10-02)

- `settings.music_enabled` (bool, défaut true), `settings.music_track` (id de `shared/data/music-library.ts`, null = défaut), `settings.music_upload_path` (objet du bucket `music`, prioritaire sur `music_track`).
- Bucket public `music` : `library/<fichier>` (bibliothèque du studio), `<wedding_id>/<timestamp>-<nom>.<ext>` (fichier du couple). 15 Mo, MP3/M4A/AAC. Aucune policy `authenticated` : écritures par server action uniquement.
- `resolve_public_slug` renvoie `music_enabled`, `music_track`, `music_upload_path`, vides tant que `sites.extras` ne contient pas `custom-music` ou que le couple a coupé la musique. C'est le paywall.
- Migration `20261002150000_invitation_music.sql`. Voir [[Musique du faire-part]].

## Domaines personnalisés (2026-10-02)

Migrations `20261002120000_custom_domains.sql` puis `20261002130000_custom_domains_hardening.sql`. La seconde porte les correctifs de la revue, car la première était déjà appliquée et une migration appliquée ne se modifie pas. Appliquées **en local**. En prod, rien n'est vérifié : `npx supabase db push --dry-run`, puis `db push` sur feu vert. Voir [[Nom de domaine personnalisé]].

`custom_domains` : le `.com` d'un couple, du paiement à la mise en ligne. Une ligne par site. Elle porte la machine à états du moteur d'achat (`landing/src/lib/custom-domains/advance.ts`), son bail et les emails déjà envoyés. Un domaine n'est pas un réglage mais un achat en plusieurs étapes, chacune pouvant échouer ou être reprise par le cron pendant que la requête d'origine tourne encore.

Colonnes, par rôle :
- **Identité** : `id`, `site_id` (unique, cascade), `wedding_id` (dénormalisé pour la RLS et les emails), `name` (`label.com` en minuscules, null tant que le couple n'a pas choisi). Index unique partiel sur `name` quand il n'est pas null. Check `custom_domains_name_format` : un seul label de 3 à 63 caractères, sans `--`, donc sans `xn--`.
- **Achat** : `years` (1 à 10, figées depuis les métadonnées du PaymentIntent, jamais recalculées), `price_paid_cents` (centimes, EUR), `stripe_payment_intent_id` (unique : un webhook rejoué n'insère pas deux fois), `vercel_order_id`.
- **Cycle de vie** : `status`, `status_changed_at` (posée à chaque changement de statut, la relance à 7 jours compte depuis elle), `purchase_started_at` (marqueur écrit avec `purchasing` **avant** l'appel d'achat), `registered_at`, `expires_at` (lue chez Vercel, pour la future spec du renouvellement), `activated_at`, `attempts` (échecs consécutifs de l'étape, le 5e mène à `failed`), `next_attempt_at`, `last_error` (code machine : `name_unavailable`, `price_above_ceiling`, `buy_unconfirmed`…), `created_at`, `updated_at`.
- **Bail du moteur** : `locked_until` (2 minutes, à l'heure de la base), `lease_token` (frappé à chaque claim ; toute écriture du moteur porte `where id = … and lease_token = …`), `claims_since_progress` (+1 à chaque claim, remis à 0 par chaque écriture ; à 3, une étape tue son process à chaque fois, la ligne passe `failed`).
- **Emails** : `notices_sent text[]`, les codes déjà envoyés pour le nom courant (`active`, `name_unavailable`, `reminder`, et `studio_failed` pour l'alerte au studio). Vidé quand le couple choisit un nouveau nom.

Pas de trigger `updated_at` dans ce dépôt : chaque écrivain, fonctions comprises, pose `updated_at` (et `status_changed_at`) lui-même.

Statuts (check `custom_domains_status_check`) :
- `awaiting_choice` : payé, pas encore de nom (« plus tard »), ou nom perdu ;
- `queued` : nom choisi, à acheter ;
- `purchasing` : appel d'achat fait, ou sur le point de l'être ;
- `registered` : à nous chez le registrar, en cours de branchement au projet ;
- `active` : servi, le certificat répond ;
- `failed` : le studio doit intervenir (il est alerté).

Clé étrangère composite : `(site_id, wedding_id)` → `sites(id, wedding_id)`, avec la contrainte unique `sites_id_wedding_id_key` créée pour elle. La RLS filtre sur `wedding_id` et le résolveur sert le `site_id` : s'ils divergeaient, un couple verrait (et recevrait par email) un domaine qui sert l'invitation d'un autre.

RLS :
- activée, policy `select` du propriétaire (via `weddings.user_id = auth.uid()`) ;
- **aucune policy d'écriture**, et `insert`, `update`, `delete`, `truncate` révoqués à `anon` et `authenticated` (Supabase leur accorde tout par défaut sur une nouvelle table, et la RLS ne s'applique pas à `truncate`) ;
- toutes les écritures passent par le service role (server actions, webhook, moteur), après vérification de propriété côté serveur.

Fonctions, toutes `security definer` avec `search_path = public` :
- `resolve_custom_domain(p_host)` → `(live, slug, languages)`, **exécutable par `anon`** : c'est le proxy qui l'appelle. Normalise l'hôte (casse, port, point final, `www.`). Pas de ligne : hôte inconnu, le proxy laisse passer vers la boutique. `live = false`, slug et langues null : domaine connu mais pas `active`, ou site pas `published` (404). `live = true` : le slug et les langues achetées (`{}` si aucune). `live` n'est jamais null depuis le durcissement.
- `claim_custom_domain(p_id)` et `claim_due_custom_domains(p_limit)`, **service role seul** : bail de 2 minutes sur une ligne `queued`, `purchasing` ou `registered`, due et non louée. Chaque claim frappe un `lease_token` neuf et incrémente `claims_since_progress`. La première sert `after()` juste après un paiement ; la seconde sert le cron, prend les `next_attempt_at` les plus anciennes avec `for update skip locked`, et deux runs qui se chevauchent obtiennent des lignes disjointes.
- `claim_custom_domain_notice(p_id, p_code)` → booléen : ajoute le code à `notices_sent` s'il n'y est pas encore. Seul l'appelant qui reçoit `true` envoie l'email. `release_custom_domain_notice(p_id, p_code)` retire le code après un envoi raté, pour que le run suivant réessaie. Service role seul.
- `custom_domain_name_taken(p_name, p_except_site)` → booléen : le nom est déjà sur une autre de nos lignes, quel que soit son statut. La recherche Vercel ne voit pas les noms réservés par nos couples ; le studio, la route de paiement et le choix depuis le dashboard l'appellent donc aussi. Service role seul, sinon n'importe qui sonderait les noms choisis par nos couples.

Les fonctions réservées au service role révoquent `all … from public, anon, authenticated` : voir [[Conventions]], section « Domaines personnalisés ».

`sites.domain` est **supprimée** (2026-10-02). Elle n'était écrite ni lue par rien ; `custom_domains` est désormais le seul endroit qui dit quel est le domaine d'un mariage.

Vérifications : `supabase/tests/custom_domains.sql`, en local, en transaction annulée (dernière ligne attendue : `custom_domains checks passed`).

## Réclamation du provisioning (2026-10-02)

Migration `20261002220000_checkout_provisions.sql`, appliquée **en local** seulement. Pas de `db push`. Elle remplace `20261002170000_checkout_provisions.sql` (jamais poussée), renommée pour passer après `20261002200000_contact_new_collections.sql` : en local, table supprimée, `20261002170000` marquée `reverted` (`migration repair --local`), puis `migration up --local`. Voir [[Domaines perso — leçons de la revue]] (n° 6) et [[Provisioning et Facturation]].

`checkout_provisions` : qui provisionne le mariage qu'un paiement a acheté. Une ligne par PaymentIntent.
- `payment_intent_id text primary key` : la clé primaire **est** la réclamation, un seul propriétaire par paiement ;
- `wedding_id uuid null`, FK `weddings(id) on delete set null`, indexée : inscrit juste après l'insert du mariage, avant le reste du provisioning et avant le tampon Stripe. Un passage n'adopte ce mariage qu'une fois son site créé ; avant, il attend (8 s au plus) puis répond `inProgress` ;
- `claimed_at timestamptz not null default now()` : une reprise le réécrit, par update conditionnel sur la valeur lue (un seul repreneur). Réclamation sans mariage reprise après **10 min** (Vercel coupe une fonction à 300 s par défaut) ;
- `updated_at` : pas de trigger dans ce repo, chaque écrivain le pose.

Service role **seul** : RLS activée, aucune policy, `revoke all … from public, anon, authenticated`, puis `grant select, insert, update, delete … to service_role`. Écrite uniquement par `landing/src/actions/create-wedding.ts` (store privé, logique dans `landing/src/lib/provision-claim.ts`).

`weddings.payment_intent_id text null`, contrainte unique `weddings_payment_intent_id_key` (même migration) : le PaymentIntent dont le checkout a créé le mariage, écrit **par l'insert lui-même**. Un paiement, un mariage. La garde « second achat » adopte un mariage qui porte ce paiement et ne rembourse que celui d'un autre paiement, ou un mariage antérieur à la colonne (`null`). Le webhook s'en sert pour savoir si **ce paiement** est provisionné. Les 23505 de l'insert se distinguent par nom de contrainte (`weddings_one_per_user` est signalée quand les deux cassent : son index est plus ancien).

Trigger `weddings_payment_intent_id_server_only` (`before insert or update of payment_intent_id`) : refuse (`insufficient_privilege`) toute écriture qui pose ou change la colonne quand `current_user` vaut `anon` ou `authenticated`. Les couples insèrent, modifient et suppriment leurs propres mariages via RLS ; sans lui, un couple pourrait inscrire ou déplacer un paiement. Vérifié en local : une requête PostgREST avec la clé service tourne en `current_user = service_role` (`session_user = authenticator`). Fonction **pas** `security definer`, sinon `current_user` serait son propriétaire.

Vérifications : `supabase/tests/checkout_provisions.sql`, en local, en transaction annulée (dernière ligne attendue : `checkout_provisions checks passed`) : privilèges, unicités, reprise conditionnelle, trigger refusé en `authenticated`/`anon`, accepté en `service_role`. Types : bloc `checkout_provisions` et colonne `weddings.payment_intent_id` reportés à la main dans `shared/types/supabase.ts` (le fichier porte d'autres changements en cours, ne jamais l'écraser).

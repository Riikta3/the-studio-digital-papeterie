---
date: 2026-09-11
status: open
category: security
---

# Audit Sécurité — Landing, Checkout, Dashboard

Audit multi-agents sur ~55k lignes (**244 agents, 244 aboutis, 0 erreur**). 77 findings
bruts, chacun soumis à 3 vérificateurs adversariaux indépendants (exploitabilité /
véracité de la citation / sévérité réelle). **45 confirmés, 32 écartés** comme faux positifs.
Les items détaillés ci-dessous ont en plus été revérifiés à la main dans le code.

Répartition : **6 critiques · 24 élevés · 13 moyens · 2 faibles**.

> [!success] Couverture complète
> Un premier passage avait laissé 3 findings sans verdict (agents en timeout). La relance
> les a tous traités et a fait remonter **4 findings supplémentaires, dont 3 élevés** —
> tous dans la dimension DoS/coûts.

> [!note] Fiabilité du tri
> Échantillon des *réfutés* recontrôlé à la main (4 findings `guest-actions.ts`, buckets
> storage publics, XSS URLs, les 7 `dangerouslySetInnerHTML`) : tous correctement motivés.
> Le cas `guest-actions.ts` est instructif — motif visuellement identique à
> `rsvp-actions.ts` (pas de `getUser()`), mais client SSR avec RLS active au lieu de
> SERVICE_ROLE qui la contourne. C'est la nuance qui sépare un faux positif d'un critique.

> [!warning] Fichier le plus urgent
> `dashboard/src/actions/rsvp-actions.ts` concentre à lui seul **6 findings** dont 3 critiques.
> Tout le module RSVP invité (`validateWeddingCode`, `searchHousehold`, `updateHouseholdRsvp`,
> `registerNewHousehold`) tourne en SERVICE_ROLE sans aucune authentification.

## Critiques

### 1. `/api/check-email` — énumération de comptes + bombe de coût
`landing/src/app/api/check-email/route.ts:15` → `lib/find-user-by-email.ts:15`

Route publique, sans auth ni rate limit, qui répond **409 si l'email existe, 200 sinon** :
oracle d'énumération de la base clients. Pire, `findUserByEmail()` boucle sur
`listUsers({ page, perPage: 1000 })` jusqu'à 100 pages → **100 000 utilisateurs scannés
par requête**, et un email *inexistant* force systématiquement le parcours complet.
Un `curl` en boucle suffit à saturer l'API Auth.

**Fix** : réponse uniforme (ne jamais révéler l'existence), rate limit par IP, et
remplacer le scan par un lookup indexé (RPC sur `auth.users` ou table `profiles`).

### 2 & 3. `rsvp-actions.ts` — SERVICE_ROLE sans authentification
`dashboard/src/actions/rsvp-actions.ts:38` (`searchHousehold`), `:63` (`updateHouseholdRsvp`)

Ces actions instancient le client **SERVICE_ROLE en ligne** (qui bypasse toute RLS),
ne vérifient aucune session, et acceptent `weddingId` **fourni par le client**.
Le commentaire du code assume explicitement le contournement de la RLS.

- Lecture : exfiltration de la liste d'invités complète de n'importe quel mariage.
- Écriture : modification arbitraire du RSVP de n'importe quel foyer.

**Fix** : ces actions servent la surface *invité* (non connectée), donc `requireWedding()`
ne s'applique pas — il faut lier l'accès au `guest_code`/`wedding_code` présenté,
vérifier que le foyer ciblé appartient bien à ce mariage, et sortir le SERVICE_ROLE
au profit de policies RLS scopées.

### 4. Policy `events` ouverte à tous les mariages
`supabase/migrations/20260902110000_events_and_guest_events.sql:48`

```sql
create policy "Guests can read enabled events"
  on public.events for select to anon
  using (enabled = true);
```
Aucun filtre sur `wedding_id` : tout anonyme lit **les événements de tous les mariages**
(dates, adresses, dress code) via PostgREST. Le commentaire juste au-dessus annonce une
intention plus stricte que ce que la policy applique.

**Fix** : scoper via le `wedding_code`/`guest_code` du visiteur, comme les autres
policies invité.

### 5. `createWedding` — PaymentIntent non lié à l'email
`landing/src/actions/create-wedding.ts:53`

Le reste du checkout est **sain** : `verifyPaymentForOrder()` recalcule le montant côté
serveur et le compare à Stripe (prix non manipulable), il y a un replay guard sur le
PaymentIntent et une garde anti-double-achat. Mais rien ne lie l'intent à l'email :
qui obtient un `paymentIntentId` valide non encore provisionné peut appeler l'action
avec **son** email et recevoir le site payé par un tiers, magic link inclus.

**Fix** : stocker l'email dans les metadata de l'intent à la création, et le comparer
dans `verifyPaymentForOrder()`.

### 6. Date de mariage perdue pour 8 locales sur 9
`landing/src/app/[locale]/studio/(steps)/checkout/page.tsx:69`

La page de saisie stocke le mois **traduit** (`t.raw("months")` →
`landing/src/app/[locale]/studio/start/page.tsx:86`), mais le checkout le relit contre
`MONTHS_FR`, une liste codée en dur en français (`checkout/page.tsx:40`) :

```ts
const monthIndex = MONTHS_FR.indexOf(info.month) + 1;  // "January" -> -1 + 1 = 0
const weddingDate = info.day && monthIndex > 0 && info.year ? ... : undefined;
```

Vérifié dans les 9 fichiers de messages : seul `fr` correspond (`en`→"January",
`de`→"Januar", `ja`→"1月"…). Pour toute autre langue, `weddingDate` vaut `undefined`,
**sans aucune erreur affichée** : le couple paie et sa date de mariage est perdue.
Elle part aussi vide dans les metadata Stripe, donc le webhook de secours ne la rattrape pas.

**Fix** : stocker l'index du mois (ou une date ISO) dans le store, jamais le libellé traduit.

### 7. `searchHousehold` expose `magic_link_token`
`dashboard/src/actions/rsvp-actions.ts:48`

Le `.select("*, guests(*)")` renvoie **toutes** les colonnes à un appelant non authentifié,
dont `households.magic_link_token` (`full_db_reset.sql:126`), `email`, `phone`,
`message_to_couple`, et `guests.dietary_requirements`.

> [!note] Nuance relevée par un vérificateur
> Le token n'est aujourd'hui **pas** exploitable comme credential : aucune route
> `/auth/verify` n'existe et son seul consommateur est du scaffolding commenté.
> C'est une exposition latente — qui deviendra critique le jour où la route sera écrite.

**Fix** : whitelister les colonnes explicitement, ne jamais utiliser `select("*")` sur un
chemin public.

## Élevés (sélection vérifiée)

| Sujet | Emplacement |
|---|---|
| `proxy.ts` ne fait que next-intl, jamais `updateSession()` → aucune garde d'auth edge | `dashboard/src/proxy.ts:7` |
| Fallback `sk_test_fallback` dans les 2 chemins argent du dashboard, contournant la garde du landing | `create-module-payment-intent/route.ts:5`, `purchase-module-actions.ts:9` |
| Policy `billing` INSERT ouverte au navigateur : lignes de facturation forgeables | `20260312130000_billing_rls_fix.sql:2` |
| `day_of_settings` : `to anon using (enabled = true)` non scopé (même défaut que `events`) | `20260902170000_guest_page_anon_reads.sql:49` |
| `rsvp_responses` / `playlist_suggestions` : INSERT anon `with check (true)` | `20260311120000_add_rsvp_responses.sql:25` |
| Proxy Spotify dashboard sans auth ni rate limit | `dashboard/src/app/api/spotify/search/route.ts:15` |
| `uploadGuestMedia` anonyme, 1 Go par appel, sans quota | `landing/src/actions/guest-page-actions.ts:484` |
| `check_guest_search_rate` : fenêtre par *mariage* et non par client → DoS à 30 requêtes | `20260903110000_guest_search_rate_limit.sql:67` |
| Reset mot de passe cassé en prod : `NEXT_PUBLIC_SITE_URL` absent côté dashboard | `forgot-password/actions.ts:16` |
| Module facturé 5 € au checkout et 10 € au dashboard | `create-module-payment-intent/route.ts:9` |

| Injection de jokers LIKE (`%`/`_`) dans `search_guest_table` : contourne le minimum de 2 caractères | `20260903110000_guest_search_rate_limit.sql:139` |
| `saveGalleryConfig` avale l'erreur d'insert ET d'update : toast « photos ajoutées » alors que rien n'est enregistré | `dashboard/src/actions/gallery-actions.ts:97` |
| Provisionnement réussi sans lien de connexion : le couple a payé et reste bloqué sur un spinner | `checkout/page.tsx:284` |
| Achats de modules add-on : jamais de facture émise, non rattrapables par le webhook | `landing/src/app/api/webhooks/stripe/route.ts:88` |
| Lien magique invité pointant vers `undefined/auth/verify` (route inexistante) | `dashboard/src/actions/email-actions.ts:81` |
| Page Invités : « 0 invité » au lieu d'une erreur si la requête échoue, et plafond implicite à 1000 lignes | `dashboard/src/app/[locale]/guests/page.tsx:29` |
| Stats Invités comptées par statut de *foyer* : les foyers « partial » disparaissent des 3 compteurs | `guests/page.tsx:51` |
| `profiles.email` n'existe pas : tout le rattachement Stripe customer des add-ons est du code mort | `create-module-payment-intent/route.ts:29` |
| Fin de fenêtre d'upload figée à 23:59:59 **UTC** : les invités perdent ou gagnent des heures | `DayOfSettingsForm.tsx:106` |

| `uploadGuestMedia` : anonyme par conception (page QR), 100 Mo/fichier × 10 par appel, mais **aucun quota cumulé par mariage ni rate limit** → facture de stockage illimitée | `landing/src/actions/guest-page-actions.ts:484` |
| `importGuestsFromExcel` : `ExcelJS.load` sur un buffer arbitraire — ni taille max, ni MIME, ni plafond de lignes, alors que tous les autres uploads du projet bornent (5/10/100 Mo) | `dashboard/src/actions/import-actions.ts:179` |
| `rsvp_responses`/`playlist_suggestions` : insert anon `with check (true)` puis lecture dashboard en `select("*")` sans `.limit()` → l'écran du couple devient inutilisable | `dashboard/src/app/[locale]/rsvp-responses/page.tsx:29` |
| `listGuestMedia` : aucun `.limit()` + 2 appels de signature par ligne (N+1 Storage) sur une table alimentée par des anonymes | `dashboard/src/actions/guest-media-actions.ts:57` |

## Ce qui est sain

- **Pas de secret exposé** : aucun `.env` commité (seul `landing/.env.example`), aucun
  `NEXT_PUBLIC_*` sensible.
- **RLS activée sur les 32 tables** — les failles sont dans les *policies*, pas dans son absence.
- **`requireWedding()`** (`dashboard/src/lib/db/current-wedding.ts`) est le bon pattern :
  `getUser()` (JWT validé) puis `weddingId` dérivé **côté serveur** depuis `user_id`,
  jamais depuis le client. Les ~12 actions qui l'utilisent ne sont pas vulnérables à l'IDOR.
- **Montant du checkout non manipulable** (recalcul serveur + comparaison Stripe).

## Notes de méthode

- Le middleware existe bien, sous le nom **`proxy.ts`** (convention Next.js 16) dans les
  deux apps — chercher `middleware.ts` donne un faux négatif.
- `updateSession()` dans `dashboard/src/utils/supabase/middleware.ts` est **du code mort** :
  défini, jamais importé.

Liens : [[Provisioning et Facturation]] · [[Base de Données]] · [[Conventions]]

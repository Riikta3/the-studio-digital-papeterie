# Back-office mariés & expérience Jour J — Design

- **Date** : 2026-09-01
- **Statut** : à valider
- **Source** : cahier des charges « THE STUDIO — Back-office mariés & expérience Jour J »
- **Périmètre** : `dashboard/` (back-office) + `landing/` (page invité Jour J) + `supabase/`

---

## 1. Le problème

Le cahier des charges décrit un back-office en six sections dont la moitié
n'existe pas : événements multiples, Jour J (QR code, plan de table, menu,
photos), FAQ, analytics. L'autre moitié existe et fonctionne — invités, RSVP,
playlist, modules, facturation — mais deux pages déjà écrites (`/guests`,
`/seating-plan`) ne sont accessibles depuis aucun lien, et le plan de table est
inutilisable à cause de deux bugs.

Une suggestion externe proposait de tout reconstruire en données fictives. Ce
serait détruire du fonctionnel pour reconstruire à l'identique. Le mock a sa
place — mais seulement là où il valide du neuf.

### Contrainte transverse : mobile-first

Non négociable, et pas seulement « responsive ». La page invité Jour J est
atteinte par scan de QR code pendant un repas de mariage : elle est
**exclusivement** mobile en usage réel. Côté dashboard, les mariés consultent
leurs RSVP depuis leur téléphone. Chaque écran de ce spec se dessine d'abord en
375 px, puis s'élargit.

Deux écrans demandent une conception mobile spécifique, pas un simple
empilement :

- **Plan de table** — le drag & drop du §13.1 n'existe pas au doigt sur 375 px.
  Le mobile obtient un mode « affectation par tap » (voir §5.2).
- **Galerie photos** — grille de vignettes, pas un tableau.

---

## 2. Ce qui existe (audit)

### Fonctionnel, branché Supabase

| Surface | Route | État |
|---|---|---|
| Accueil + KPIs | `/` | OK — countdown, insights, activité |
| Invités & foyers | `/guests` | OK (615 l.) — **orpheline, aucun lien** |
| RSVP public | `/rsvp` | OK (644 l.) |
| Réponses RSVP | `/rsvp-responses` | OK — liste nominale, notes admin |
| Playlist | `/playlist` | OK — suggestions, Spotify |
| Messages | `/messages` | OK |
| Modules | `/modules` | OK — catalogue 15 modules, achat Stripe |
| Facturation | `/billing` | OK |
| Réglages | `/settings` | OK |
| Plan de table | `/seating-plan` | **cassé — orphelin** |

### Bugs confirmés dans le plan de table

1. **`wedding_id` confondu avec `user.id`** — systémique dans
   `src/actions/table-actions.ts` (`createTable`, `updateTablePosition`,
   `deleteTable`) et dans `src/app/[locale]/seating-plan/page.tsx`. Or
   `tables.wedding_id` référence `weddings.id`, pas `profiles.id`. Les tables
   créées sont écrites avec un `wedding_id` qui n'existe pas dans `weddings`,
   et la requête invités ne remonte jamais rien.
2. **`TableNode` ne reçoit pas ses invités** — `SeatingCanvas` rend
   `<TableNode table={table} />` sans passer la liste. Un commentaire dans le
   code admet le problème sans le résoudre. Aucune table n'affiche jamais
   personne.

Ces deux bugs rendent la page inutilisable. Le §13.1 demande par ailleurs un
drag & drop avec capacité affichée et recherche : la réécriture du canvas est
plus courte que la réparation suivie d'une réécriture.

### Ce qui n'existe pas

Événements multiples · Jour J complet (QR, page invité, Ma table, menu, photos)
· repas/allergies structurés · FAQ éditable · analytics · relances.

### Contexte `landing/`

`landing/` n'a **pas** de route d'invitation réelle : seulement
`/invitation/demo/[themeId]` et `/invitation/mediterranean-classy`. La page
Jour J devra donc résoudre elle-même `sites.slug → weddings → sites.theme_id →
resolveTheme()`. Le moteur de thèmes (`src/components/invitation/themes/`) est
solide et documenté : un thème est un dossier, `resolveTheme()` ne jette jamais
et retombe sur le premier thème.

---

## 3. L'approche

Quatre étapes. Le mock sert **uniquement** à valider l'UX du Jour J avant
d'écrire migrations, RLS et storage. Tout le reste est réel dès le premier
commit.

```
Étape 0  Nav 6 sections (réel)        →  le client voit l'architecture
Étape 1  Jour J en mock               →  le client valide l'UX          ← GATE
Étape 2  Jour J branché Supabase      →  mêmes composants, autre source
Étape 3  Événements multiples (réel)
Étape 4  Améliorations de l'existant
```

Le contrat de props des composants Jour J est écrit une fois, à l'étape 1. Le
passage mock → réel ne touche que la couche données : les composants ne
changent pas.

---

## 4. Étape 0 — Navigation en six sections

### Architecture cible (§23)

```
ACCUEIL          /
INVITÉS          /guests · /rsvp-responses · /guests/groupes · /guests/repas
INVITATION       /modules · /invitation/evenements · /invitation/programme
                 /invitation/lieu · /invitation/faq · /playlist
JOUR J           /jour-j/plan-de-table · /jour-j/qr-code · /jour-j/menu
                 /jour-j/photos · /jour-j/parametres
STATISTIQUES     /stats
PARAMÈTRES       /settings · /billing · /messages
```

### Composant

`Sidebar.tsx` passe d'une liste plate de sept liens à une structure à deux
niveaux : `NavSection[]`, chaque section portant `key`, `icon` et `items[]`.
Une section dont un enfant est actif s'ouvre; les autres restent repliées.

Sur mobile la sidebar est déjà un tiroir (`translate-x`) — on garde ce
mécanisme, on ajoute l'accordéon à l'intérieur, et chaque cible tactile fait au
moins 44 px de haut.

`/guests` et `/seating-plan` deviennent enfin atteignables. `/seating-plan`
redirige vers `/jour-j/plan-de-table`.

### Pages pas encore construites

Un composant partagé `<ComingSoon />` : titre de la page, une phrase, le
visuel Studio. Le client voit l'ossature complète sans qu'on simule du contenu
qui n'existe pas.

### i18n

Les clés `Sidebar.*` passent en arborescence (`Sidebar.sections.guests.label`,
`…items.all`). Les neuf locales — `fr en de es pt it ar zh ja` — sont mises à
jour d'un bloc; `fr` fait foi, les autres sont traduites.

---

## 5. Étape 1 — Jour J en mock

Toutes les données fictives dans **un seul fichier**,
`shared/data/jour-j-mock.ts`, typé avec les types définitifs de
`shared/types/jour-j.ts`. C'est le point de bascule de l'étape 2 : un import à
remplacer, pas une chasse aux constantes dispersées. Le fichier est partagé par
le dashboard et la page invité (§5.7).

Volumétrie alignée sur le cahier : 140 invités, 124 confirmés, 4 en attente,
116 placés, 286 photos. Tables : Capri, Amalfi, Portofino, Positano, Ravello.

### 5.1 Types (définitifs dès le mock)

```ts
type DayOfTable   = { id; name; shape: "round"|"rectangle"|"long";
                      capacity; x; y; guestIds: string[] }
type MenuCategory = { id; key: "cocktail"|"starter"|"main"|"cheese"|"dessert"|"drinks";
                      enabled; items: MenuItem[] }
type MenuItem     = { id; name; description?; variant?: "classic"|"veggie"|"child" }
type GuestMedia   = { id; kind: "photo"|"video"; url; thumbUrl;
                      uploaderName?; uploadedAt; hidden }
type DayOfSettings= { enabled; qrSlug; galleryVisibleToGuests;
                      uploadsOpenUntil; afterWeddingMode; venuePlanUrl? }
```

### 5.2 Plan de table (§13.1) — réécriture

Deux zones : invités non placés / tables. Affiche la capacité utilisée
(« Table Capri — 8/10 »), le total placés/restants, une recherche par nom.

**Desktop (≥ 768 px)** — drag & drop `@dnd-kit` (déjà une dépendance), tables
positionnables sur un canevas, invités glissables depuis le panneau latéral.
On corrige au passage le défaut du code actuel : chaque `TableNode` reçoit ses
invités, dérivés d'une seule source (`guestsById`), pas d'un état dupliqué.

**Mobile (< 768 px)** — le drag & drop est abandonné, pas dégradé. À la place :

- une liste de tables en accordéon, chacune montrant `8/10` et ses convives;
- un bouton « Placer des invités » par table → feuille de sélection multiple
  avec recherche, cases à cocher, compteur de places restantes;
- sur un convive placé, un menu « Déplacer vers… / Retirer ».

C'est plus rapide au doigt qu'un drag & drop tactile, et ça reste la même
donnée et les mêmes actions.

### 5.3 QR code (§14)

Généré à partir d'une URL permanente `thestudio.fr/jourj/<slug>`, où `<slug>`
est le `sites.slug` existant. **Le QR n'est jamais régénéré** : il ne dépend
que du slug, jamais des tables, du menu ni des invités. La page l'énonce
explicitement pour rassurer les mariés qui l'auront fait imprimer.

Téléchargement PNG **et** SVG (impression). Rendu SVG côté serveur avec
`qrcode` — pas de canvas, donc pas de dépendance au navigateur.

### 5.4 Menu (§18)

Six catégories activables/désactivables, réordonnables, chacune avec ses
items. La variante par invité (classique / végétarien / enfant) est portée par
le champ `variant` dès maintenant mais **non exposée** en V1 — le cahier la
classe en évolution (§18, phase 5). Le champ existe pour que la V2 ne demande
pas de migration.

### 5.5 Photos & galerie (§20, §21)

Grille de vignettes — mobile en deux colonnes, desktop en quatre. Par média :
afficher, télécharger, masquer, supprimer. « Tout télécharger » produit un ZIP.

Deux réglages **indépendants**, comme l'exige le §21 :
`galleryVisibleToGuests` (les invités peuvent-ils voir) et `uploadsOpenUntil`
(jusqu'à quand peuvent-ils envoyer). Partager et consulter ne sont pas la même
permission.

### 5.6 Paramètres Jour J

Activation du module, visibilité de la galerie, fenêtre d'upload, mode
« Merci » d'après-mariage (§22), plan de salle optionnel (§17 — image ou PDF,
non interactif en V1).

### 5.7 Page invité `/jourj/[slug]` — dans `landing/`

Mobile-first au sens strict : c'est le seul contexte d'usage.

Résolution : `sites.slug → weddings → sites.theme_id → resolveTheme()`. La
page reprend la DA de l'invitation — couleurs, typographies, monogramme, noms
des mariés — via le manifeste du thème, sans dupliquer le moteur.

Navigation : **Ma table · Le menu · Nos photos** (+ Programme en option).

**Ma table (§16)** — recherche par prénom/nom avec autocomplétion parmi les
seuls invités **confirmés**. Résultat personnalisé : « Marie, votre table
est… CAPRI ». *Confidentialité* : l'autocomplétion ne renvoie jamais la liste
complète. L'endpoint exige au minimum deux caractères, plafonne à cinq
résultats, et ne renvoie que prénom + nom + table — jamais email, téléphone ni
statut.

**Nos photos** — upload direct depuis le téléphone, sans compte ni application
(§19). Compression des images côté client avant envoi, plafond de poids sur la
vidéo, message d'erreur explicite au-delà.

À l'étape 1 cette page lit le **même** jeu de données que le dashboard : les
deux apps résolvent déjà `@shared/*` vers `../shared/*` dans leur `tsconfig`.
Le mock vit donc en `shared/data/jour-j-mock.ts`, importé de part et d'autre
via `@shared/data/jour-j-mock`. Une seule source, donc pas de dérive entre
l'écran des mariés et celui des invités pendant la validation.

Les **types**, eux, restent partagés au-delà de l'étape 1 : ils vont dans
`shared/types/jour-j.ts` et survivent au mock. À l'étape 2 on supprime
`shared/data/jour-j-mock.ts` et rien d'autre ne bouge.

### Ce qui n'est PAS dans l'étape 1

Plan de salle interactif (§17, explicitement dé-priorisé), menu individualisé
par invité (§18), relances automatiques (§10), domaine personnalisé (§12), mur
photo live. Phase 5 du cahier.

---

## 6. Étape 2 — Branchement Supabase du Jour J

Une seule migration, `20260901xxxxxx_day_of_module.sql`.

```sql
day_of_settings (wedding_id UNIQUE, enabled, gallery_visible_to_guests,
                 uploads_open_until, after_wedding_mode, venue_plan_url)
menu_categories (wedding_id, key, enabled, position)
menu_items      (category_id, name, description, variant, position)
guest_media     (wedding_id, kind, storage_path, thumb_path,
                 uploader_name, hidden, created_at)

alter table public.tables
  add column seats_label text,          -- « Table 12 » à côté du nom
  add column position int default 0;    -- ordre d'affichage mobile
```

**RLS** — deux régimes distincts, c'est le point délicat :

- *mariés* : `for all` conditionné à `exists (select 1 from weddings where
  id = wedding_id and user_id = auth.uid())`, le motif déjà employé partout
  ailleurs dans le schéma;
- *invités anonymes* : `insert` sur `guest_media` autorisé quand
  `day_of_settings.uploads_open_until > now()`; `select` autorisé seulement
  quand `gallery_visible_to_guests` **et** `hidden = false`.

**Storage** — bucket `guest-media`, upload anonyme, lecture publique gouvernée
par les réglages. On s'appuie sur les migrations `public_storage_buckets` et
`media_storage` déjà en place.

**La recherche « Ma table » passe par une RPC**, pas par un `select` direct :
`search_guest_table(wedding_id, query)` en `security definer`, renvoyant au
plus cinq lignes de `(first_name, last_name, table_name)`. C'est la seule façon
d'exposer la recherche sans ouvrir `guests` en lecture anonyme.

**Fixes portés ici** : `wedding_id` correct dans tout `table-actions.ts`, via
un helper `getCurrentWeddingId()` partagé.

---

## 7. Étape 3 — Événements multiples (§5)

```sql
events       (wedding_id, key, name, date, time, address, description,
              dress_code, position, enabled)
guest_events (guest_id, event_id, status)   -- pending|confirmed|declined
```

Quatre événements par défaut à la création : Welcome Dinner, Wedding Day,
Brunch, Soirée — seul Wedding Day activé.

Le RSVP passe de « un statut par invité » à « un statut par invité et par
événement ». `guests.status` est **conservé** et reflète le statut sur
l'événement principal, ce qui évite de réécrire les écrans existants d'un bloc.

Ces informations peuvent alimenter l'invitation (§5), en écriture vers
`sites`/`settings` — à câbler après validation du modèle.

---

## 8. Étape 4 — Améliorations de l'existant

Par ordre de valeur : repas & allergies structurés (§3, aujourd'hui un simple
texte libre `dietary_requirements`) · filtres et sélection multiple sur les
sans-réponse (§10) · FAQ éditable et réordonnable (§9) · analytics simples
(§11) · lieu & informations pratiques (§8).

Les relances restent manuelles en V1 : le cahier autorise explicitement à
différer l'envoi automatique.

---

## 9. Découpage des fichiers

Le `GuestsTable.tsx` actuel fait 615 lignes et la page `/rsvp` 644 : deux
fichiers qu'il devient coûteux de modifier. On ne les refactorise pas dans ce
projet — hors périmètre — mais les nouveaux écrans se tiennent à une règle :
un composant par responsabilité, la page ne fait que composer et charger.

```
shared/
  types/jour-j.ts                      ← types, permanents
  data/jour-j-mock.ts                  ← étape 1 seulement, supprimé à l'étape 2

dashboard/src/
  app/[locale]/jour-j/
    plan-de-table/page.tsx  qr-code/page.tsx  menu/page.tsx
    photos/page.tsx         parametres/page.tsx
  components/jour-j/
    seating/   SeatingBoard.tsx (desktop)  SeatingList.tsx (mobile)
               TableCard.tsx  UnseatedPanel.tsx  AssignGuestsSheet.tsx
    qr/        QrCodePanel.tsx
    menu/      MenuEditor.tsx  MenuCategoryCard.tsx
    media/     MediaGrid.tsx  MediaTile.tsx  BulkDownloadButton.tsx
    settings/  DayOfSettingsForm.tsx
  components/navigation/  NavSection.tsx  ComingSoon.tsx

landing/src/app/[locale]/jourj/[slug]/
  page.tsx  ma-table/page.tsx  menu/page.tsx  photos/page.tsx
```

---

## 10. Tests

- **Server actions** — un test par action : cas nominal, non authentifié,
  mariage d'autrui (l'isolation RLS est la garantie de confidentialité, elle
  se teste).
- **RPC `search_guest_table`** — ne renvoie que des confirmés, plafonne à
  cinq, refuse une requête d'un caractère, n'expose aucun champ de contact.
- **Composants** — le plan de table sur son invariant : capacité jamais
  dépassée, un invité assis à une seule table, le total placés/restants
  cohérent après chaque opération.
- **Mobile** — chaque écran vérifié à 375 px : pas de scroll horizontal,
  cibles tactiles ≥ 44 px.

---

## 11. Risques

| Risque | Traitement |
|---|---|
| Fuite de la liste d'invités par « Ma table » | RPC `security definer`, 2 car. min, 5 résultats max, champs restreints |
| Upload anonyme abusé | Fenêtre `uploads_open_until`, plafond de poids, bucket dédié |
| Le QR change après impression | Dérivé du seul `sites.slug`; jamais régénéré; énoncé dans l'UI |
| Le mock ne survit pas au réel | Types définitifs et partagés dès l'étape 1, un seul fichier de mock |
| Drag & drop injouable au doigt | Mode d'affectation mobile dédié, pas une dégradation |
| Régression sur l'existant | L'existant n'est pas réécrit; seule la nav change à l'étape 0 |

---

## 12. Points tranchés

- Jour J **inclus pour tous**, activable par un réglage — pas un module payant.
- Page invité dans **`landing/`**, pour réutiliser le moteur de thèmes.
- Plan de table **réécrit**, pas réparé.
- Le mock ne couvre **que** le Jour J.
- Mobile-first sur l'ensemble; conception mobile spécifique pour le plan de
  table et la galerie.

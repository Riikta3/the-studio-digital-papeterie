---
date: 2026-09-02
status: approved
category: architecture
---

# Branchement du dashboard sur Supabase (étape 2)

> Suite de [[2026-09-01-back-office-maries-jour-j-design]]. L'étape 1 a livré
> les écrans sur données fictives et le schéma SQL. Cette étape remplace le
> mock par la vraie base.

## 1. Objectif

Les 12 écrans Jour J / Invitation / Invités et la page invité anonyme lisent
et écrivent dans Supabase. `shared/data/jour-j-mock.ts` et
`shared/data/invitation-mock.ts` disparaissent du dépôt.

Un script de seed peuple un mariage de démonstration avec le jeu de données
actuel (140 invités, 124 confirmés, 10 tables, menu, FAQ, lieu), de sorte que
la démonstration survive au branchement — mais en venant désormais de la base,
donc en exerçant réellement les lectures, les écritures et les policies RLS.

## 2. État vérifié avant travaux

Constaté sur le projet lié `pftvcpxwbprmphhgwvxc` le 2026-09-02, colonne par
colonne, et non supposé :

- `weddings` contient 10 lignes ; **toutes les autres tables sont vides**.
- Les 10 tables de l'étape 1 existent, RLS active, `search_guest_table`
  présente et `security definer`.
- Aucun des 11 composants récepteurs n'a de persistance : tous mutent un
  `useState` local initialisé par une prop `initial*`. **Brancher signifie donc
  écrire les actions *et* les appeler depuis les composants**, pas seulement
  remplacer des imports.

### 2.1 Écarts schéma / types

Trois champs déclarés par les types n'avaient aucune colonne derrière eux.
Comblés par `20260902150000_wiring_schema_gaps.sql` :

| Type | Champ | Colonne ajoutée |
|---|---|---|
| `DayOfTable` | `x`, `y` | `tables.x`, `tables.y` (int) |
| `InvitationGuest` | `phone` | `guests.phone` (text) |
| `Household` | `group` | `households.guest_group` (text, contraint) |

`DayOfSettings.qrSlug` **ne reçoit pas** de colonne. Le slug public vit déjà
sur `sites.slug`, qui est `unique`. Deux colonnes de slug seraient deux
sources de vérité pour la même URL publique, et l'exigence du QR permanent
(§14 : le code imprimé ne doit jamais casser) se tient plus facilement avec
une seule. `qrSlug` est donc lu depuis `sites.slug`.

### 2.2 Noms des mariés

`weddings` ne porte pas de nom de mariée ni de marié : seulement `partner_name`.
Les noms vivent sur `profiles` (`first_name`, `last_name`, `partner_name`).
Tout écran affichant les noms du couple joint `profiles`, jamais `weddings`.

## 3. Architecture

### 3.1 Résolution du mariage courant

Chaque action du dashboard suit le patron déjà en place dans
`rsvp-response-actions.ts` :

```
createClient() → auth.getUser() → weddings.select(id).eq(user_id, user.id)
```

Ce patron est répété plutôt que factorisé en une seule fonction : chaque
action doit rester lisible isolément, et un helper partagé qui renvoie un
`wedding_id` invite à l'oublier dans le `where` d'une requête. Le filtre
`.eq("wedding_id", wedding.id)` reste écrit explicitement à chaque requête,
en plus de la RLS.

**La RLS n'est pas la seule défense.** Les policies filtrent déjà par
propriétaire, mais le filtre applicatif est conservé : une policy modifiée
par erreur ne doit pas suffire à exposer les données d'un autre couple.

### 3.2 Frontière serveur / client (contrainte dure)

**Aucune donnée nominative d'invité ne doit atteindre le bundle client.**

Quatre violations existent aujourd'hui et sont corrigées par cette étape :

| Composant | Reçoit aujourd'hui | Doit recevoir |
|---|---|---|
| `SeatingScreen` | 140 invités : noms, statut, régime | noms + id des invités **à placer ou placés**, sans régime |
| `GuestGroupsBoard` | `InvitationGuest[]` complet : email, téléphone, allergies, notes | les champs que l'écran affiche réellement |
| `GuestMealsBoard` | idem | `meal`, `dietaryFlags`, `allergies`, `isChild`, nom |
| `MediaGrid` | médias **masqués inclus** | médias visibles ; les masqués ne partent pas |

Le modèle à suivre existe déjà dans le dépôt : `stats/page.tsx` agrège côté
serveur avant de passer quoi que ce soit à un composant client.

Un composant client peut recevoir un nom d'invité quand l'écran consiste à
manipuler des invités nommés — un plan de table sans noms est inutilisable.
Ce qui est interdit, c'est l'envoi de champs que l'écran n'affiche pas :
email, téléphone, notes privées, allergies hors écran repas.

### 3.3 Page invité anonyme (§16)

`TableFinder` est aujourd'hui `"use client"`, importe le mock et exécute
`searchSeatedGuests` **dans le navigateur** : la liste complète des invités
part vers quiconque scanne le QR code. C'est précisément ce que la RPC
`search_guest_table` existe pour empêcher.

Après branchement :

- `TableFinder` reste client (il gère la saisie) mais n'a plus aucune donnée
  d'invité. Chaque recherche appelle une server action qui appelle la RPC.
- La RPC applique le minimum de 2 caractères, le plafond de 5 résultats, le
  filtre `confirmed` + `table_id is not null`, et ne renvoie que quatre
  colonnes.
- `searchSeatedGuests` (`shared/lib/seating.ts`) et ses 13 tests **restent**.
  La fonction cesse d'être le chemin de la page invité, mais elle continue de
  documenter et de verrouiller la règle de confidentialité côté code, et le
  dashboard s'en sert pour sa propre recherche sur données déjà chargées.
- Le layout résout `slug` via `sites.slug → wedding_id`, puis vérifie
  `day_of_settings.enabled`. Un slug inconnu ou un module désactivé donne
  `notFound()`.

### 3.4 Écriture du plan de table

**Écriture optimiste à chaque geste.** Une dépose met l'affichage à jour
immédiatement, écrit en base, et revient à l'état précédent en cas d'erreur
avec un toast Sonner.

Justification : un plan de table est un travail long et fragmenté. Un bouton
« Enregistrer » explicite se paie d'un travail perdu au premier rechargement
ou onglet fermé, et impose un avertissement avant de quitter la page. Les
gestes concernés sont peu fréquents (une dépose toutes quelques secondes au
plus), donc le coût en requêtes est négligeable.

Trois écritures : affecter un invité (`guests.table_id`), le retirer
(`table_id = null`), déplacer une table (`tables.x`, `tables.y`).

Le déplacement de table est **débattu** (`debounce`) à 400 ms : un glissement
produit des dizaines d'événements, dont un seul mérite d'être écrit.

### 3.5 Revalidation

Chaque action écrivante appelle `revalidatePath` sur la route concernée. Les
écrans qui dérivent des compteurs de plusieurs tables (accueil, statistiques)
sont revalidés en plus quand une écriture change leurs agrégats.

## 4. Périmètre par écran

| Écran | Lectures | Écritures |
|---|---|---|
| Accueil | `weddings`, `profiles`, `guests` (agrégats), `tables`, `guest_media`, `day_of_settings`, `sites.slug` | — |
| Invités / groupes | `guests`, `households` | groupe, foyer, création, suppression |
| Invités / repas | `guests` | `meal`, `dietary_flags`, `allergies` |
| Invitation / événements | `events` | CRUD, `position`, `enabled` |
| Invitation / programme | `events`, `schedule_entries` | CRUD, `position` |
| Invitation / lieu | `venues`, `accommodations` | champs, photo, CRUD hébergements |
| Invitation / FAQ | `faq_entries` | CRUD, `position`, `published` |
| Jour J / plan de table | `tables`, `guests` (restreints) | `table_id`, `x`, `y` |
| Jour J / menu | `menu_categories`, `menu_items` | CRUD, `enabled`, `position` |
| Jour J / QR code | `sites.slug` | — |
| Jour J / paramètres | `day_of_settings` | tous les champs |
| Jour J / photos | `guest_media` | `hidden`, suppression |
| Statistiques | `guests`, `guest_events`, `events` | — |

Les visites (`stats.visits`, `visitsByDay`) n'ont **aucune table**. Cet écran
conserve donc une source fictive, clairement annotée, jusqu'à ce qu'une
décision soit prise sur la mesure d'audience. C'est le seul reste de mock
admis à la fin de cette étape, et il ne concerne pas de données personnelles.

## 5. Photos invités

Les médias vivent dans le bucket `guest-media`. La lecture construit une URL
signée côté serveur ; le chemin de stockage brut ne part pas au client. La
suppression retire la ligne **et** l'objet du bucket — une ligne supprimée
sans son fichier laisse un objet orphelin payant et toujours accessible par
URL signée.

## 6. Seed de démonstration

`scripts/seed-demo-wedding.mjs`, exécuté à la main, jamais par CI.

- Prend un `wedding_id` en argument. **Refuse de s'exécuter sans argument
  explicite** : aucun choix implicite du mariage à peupler.
- Refuse d'écrire si le mariage cible contient déjà des invités, sauf
  `--force`, qui purge d'abord les tables peuplées par le script.
- Utilise la clé `service_role` (contournement RLS assumé : c'est un script
  d'administration local).
- Écrit dans l'ordre des dépendances : `events` → `households` → `guests` →
  `tables` → affectations → `guest_events` → `venues` → `accommodations` →
  `faq_entries` → `menu_categories` → `menu_items` → `day_of_settings`.
- N'invente pas de photos : `guest_media` reste vide, faute de fichiers réels
  à déposer dans le bucket. L'écran photos affiche donc son état vide, qui
  est un état légitime et lui aussi à vérifier.

Le script est documenté dans `scripts/README.md` avec la commande exacte.

## 7. Tests

Le seul lanceur du dépôt est `node:test` avec `--experimental-strip-types`.
Aucune dépendance de test n'est ajoutée.

Ce qui est testable sans base, et sera testé :

- les fonctions de projection qui restreignent les champs envoyés au client
  (une par écran fuyant) — un test par champ interdit, qui échoue si le champ
  réapparaît ;
- la conversion `snake_case` base ↔ `camelCase` types, dans les deux sens ;
- `shared/lib/seating.ts` : les 13 tests existants doivent rester verts.

Les lectures et écritures Supabase elles-mêmes ne sont pas testées
automatiquement : il n'y a pas d'instance de test dans ce dépôt, et en
introduire une dépasse le périmètre. Elles sont vérifiées à la main, écran par
écran, sur le mariage de démonstration — et cette vérification fait partie de
la livraison, pas d'un après.

## 8. Hors périmètre

- Synchroniser `guests.status` depuis `guest_events` par trigger : le spec de
  l'étape 1 diffère explicitement ce câblage.
- Supprimer `guests.dietary_requirements` : colonne dépréciée avec données
  potentiellement vivantes ; la supprimer est une décision du client.
- La mesure d'audience réelle (voir §4).
- Remplacer `translate()` par `unaccent()` dans la RPC.

## 9. Critères d'acceptation

1. `grep -rn "jour-j-mock\|invitation-mock" --include="*.ts" --include="*.tsx"`
   ne renvoie plus rien hors `shared/data/` supprimé.
2. Les deux fichiers de mock ne sont plus dans le dépôt.
3. Aucun bundle client ne contient d'email, de téléphone, de note privée ou
   d'allergie d'invité. Vérifié en cherchant dans `.next/static/chunks` après
   build, pas seulement par lecture du code.
4. La page invité anonyme ne contient aucune liste d'invités dans son bundle.
5. Les 13 tests de `seating.test.mjs` passent, plus les nouveaux tests de
   projection.
6. `npm run build:dashboard` et `npm run build:landing` sortent en code 0.
7. Chaque écran a été ouvert sur le mariage de démonstration, en desktop et en
   mobile, et son écriture principale vérifiée par un rechargement.

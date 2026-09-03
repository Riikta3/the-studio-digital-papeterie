# Branchement du dashboard sur Supabase — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les 12 écrans du dashboard et la page invité anonyme lisent et
écrivent dans Supabase ; les deux fichiers de mock disparaissent du dépôt.

**Architecture:** Une couche de mapping `snake_case ↔ camelCase` par domaine,
des server actions groupées par écran suivant le patron existant
(`getUser` → résolution du `wedding_id` → requête filtrée), et des fonctions
de projection pures qui restreignent ce que reçoit chaque composant client.
Un script de seed peuple un mariage de démonstration pour que les écrans
pleins soient réellement exercés.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (`@supabase/ssr`),
next-intl 4, `node:test` avec `--experimental-strip-types`, Sonner.

**Spec:** `docs/superpowers/specs/2026-09-02-branchement-dashboard-supabase-design.md`

## Global Constraints

- **Aucune donnée nominative non affichée ne part au client.** Email,
  téléphone, notes privées, allergies hors écran repas : jamais dans une prop
  de composant `"use client"`. Vérification par recherche dans
  `.next/static/chunks` après build, pas seulement par lecture du code.
- **Le filtre applicatif `.eq("wedding_id", wedding.id)` est écrit
  explicitement à chaque requête**, en plus de la RLS. La RLS n'est pas la
  seule défense.
- **`search_guest_table` ne doit pas être modifiée.** Ni sa clause `where`, ni
  ses colonnes, ni son `limit 5`, ni son minimum de 2 caractères, ni ses
  `grant`. Voir l'avertissement dans `supabase/migrations/README-step-2.md`.
- **Aucune dépendance de test ajoutée.** Le seul lanceur est `node:test` avec
  `--experimental-strip-types` (Node 24).
- **Code, commentaires et commits en anglais.** Discussion en français.
- **Navigation :** toujours les helpers de `src/navigation.ts`, jamais
  `next/link` brut (le préfixe de locale serait perdu).
- **Boutons destructeurs :** `className="bg-red-500 hover:bg-red-600
  text-white"` — il n'y a pas de variable CSS `--destructive`.
- **Mobile d'abord.** Chaque écran touché est vérifié à 375 px comme à
  1440 px. Cible tactile minimale : 44 px (`min-h-11`).
- **RSC par défaut**, `"use client"` seulement si nécessaire.
- **`guests.status` n'est pas synchronisé depuis `guest_events`** : le spec de
  l'étape 1 diffère explicitement ce câblage.
- **`guests.dietary_requirements` n'est pas supprimée** : colonne dépréciée
  avec données potentiellement vivantes.
- Les visites de l'écran statistiques restent fictives et annotées : aucune
  table ne les porte.

---

### Task 1: Couche de mapping et résolution du mariage

**Files:**
- Create: `dashboard/src/lib/db/mappers.ts`
- Create: `dashboard/src/lib/db/mappers.test.mjs`
- Create: `dashboard/src/lib/db/current-wedding.ts`

**Interfaces:**
- Consumes: `shared/types/jour-j.ts`, `shared/types/invitation.ts` (types
  existants, inchangés).
- Produces:
  - `rowToEvent(row): WeddingEvent`, `eventToRow(e): Record<string, unknown>`
  - `rowToGuest(row): InvitationGuest`, `guestToRow(g)`
  - `rowToHousehold(row): Household`, `householdToRow(h)`
  - `rowToTable(row, guestIds: string[]): DayOfTable`, `tableToRow(t)`
  - `rowToScheduleEntry(row)`, `scheduleEntryToRow(s)`
  - `rowToVenue(row): Venue`, `venueToRow(v)`
  - `rowToAccommodation(row)`, `accommodationToRow(a)`
  - `rowToFaqEntry(row)`, `faqEntryToRow(f)`
  - `rowToMenuCategory(row, items)`, `menuCategoryToRow(c)`,
    `rowToMenuItem(row)`, `menuItemToRow(i)`
  - `rowToGuestMedia(row, signedUrl, signedThumbUrl): GuestMedia`
  - `requireWedding(): Promise<{ supabase, user, weddingId }>` depuis
    `current-wedding.ts` — lève `Error("Unauthorized")` si pas de session,
    `Error("Wedding not found")` si aucun mariage.

**Contexte à connaître :**

Les colonnes réelles, relevées sur la base le 2026-09-02 (ne pas les deviner) :

```
guests:     id, wedding_id, household_id, first_name, last_name, email, phone,
            status, table_id, is_child, is_plus_one, meal, dietary_flags,
            allergies, notes, guest_group, dietary_requirements, created_at
tables:     id, wedding_id, name, capacity, seats_label, position, shape, x, y,
            created_at
households: id, wedding_id, name, email, phone, address, guest_group, created_at
events:     id, wedding_id, key, name, date, time, address, description,
            dress_code, position, enabled, created_at
schedule_entries: id, wedding_id, event_id, time, title, description, position
venues:     id, wedding_id, name, address, city, maps_url, waze_url,
            parking_info, access_info, transport_info, photo_url
accommodations: id, wedding_id, name, city, distance, phone, booking_url,
            offer, photo_url, position
faq_entries: id, wedding_id, question, answer, position, published
menu_categories: id, wedding_id, key, enabled, position
menu_items: id, category_id, name, description, variant, position
guest_media: id, wedding_id, kind, storage_path, thumb_path, uploader_name,
            hidden, created_at
day_of_settings: id, wedding_id, enabled, gallery_visible_to_guests,
            uploads_open_until, after_wedding_mode, venue_plan_url
```

Pièges nommés :
- `Household.group` (type) ↔ `households.guest_group` (colonne). `group` est un
  mot réservé SQL ; le nom de colonne diffère volontairement.
- `InvitationGuest.group` ↔ `guests.guest_group`, même raison.
- `DayOfTable.guestIds` n'est pas une colonne : il se reconstruit depuis
  `guests.table_id`. `rowToTable` prend donc les ids en second argument.
- `DayOfSettings.qrSlug` vient de `sites.slug`, pas de `day_of_settings`.
- `guests.dietary_requirements` existe mais est dépréciée : les mappers ne la
  lisent ni ne l'écrivent.
- `events.date` est un `date` Postgres : il revient en `"YYYY-MM-DD"`, ce que
  `WeddingEvent.date` attend déjà. Ne pas passer par `new Date()`, qui
  décalerait le jour selon le fuseau.
- `guest_media.created_at` est `timestamptz` → `GuestMedia.uploadedAt` (ISO).

- [ ] **Step 1: Écrire les tests des mappers en aller-retour**

Créer `dashboard/src/lib/db/mappers.test.mjs`. Un test par domaine, chacun
vérifiant qu'une ligne convertie en objet puis reconvertie en ligne redonne
les mêmes valeurs, et que les renommages pièges tiennent.

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rowToGuest, guestToRow,
  rowToHousehold, householdToRow,
  rowToEvent, eventToRow,
  rowToTable,
} from "./mappers.ts";

test("guest row maps guest_group to group and back", () => {
  const row = {
    id: "g-1", wedding_id: "w-1", household_id: "h-1",
    first_name: "Élodie", last_name: "Moreau",
    email: "e@example.com", phone: "0600000000",
    status: "confirmed", table_id: "t-1",
    is_child: false, is_plus_one: false,
    meal: "vegetarian", dietary_flags: ["gluten-free"],
    allergies: "arachides", notes: "témoin",
    guest_group: "friends",
  };
  const guest = rowToGuest(row);
  assert.equal(guest.group, "friends");
  assert.equal(guest.householdId, "h-1");
  assert.equal(guest.isChild, false);
  assert.deepEqual(guest.dietaryFlags, ["gluten-free"]);

  const back = guestToRow(guest);
  assert.equal(back.guest_group, "friends");
  assert.equal(back.household_id, "h-1");
  assert.equal(back.first_name, "Élodie");
  // The deprecated column must never be written.
  assert.ok(!("dietary_requirements" in back));
});

test("household row maps guest_group to group", () => {
  const h = rowToHousehold({
    id: "h-1", wedding_id: "w-1", name: "Famille Moreau",
    guest_group: "family", email: null, phone: null, address: null,
  });
  assert.equal(h.group, "family");
  assert.equal(h.email, undefined);
  assert.equal(householdToRow(h).guest_group, "family");
});

test("event date stays a plain YYYY-MM-DD string", () => {
  const e = rowToEvent({
    id: "e-1", wedding_id: "w-1", key: "wedding-day",
    name: "Cérémonie", date: "2027-06-19", time: "17h00",
    address: null, description: null, dress_code: null,
    position: 1, enabled: true,
  });
  assert.equal(e.date, "2027-06-19");
  assert.equal(e.dressCode, undefined);
  assert.equal(eventToRow(e).dress_code, null);
});

test("table rebuilds guestIds from the ids it is handed", () => {
  const t = rowToTable(
    { id: "t-1", wedding_id: "w-1", name: "Capri", capacity: 12,
      seats_label: "Table 1", position: 0, shape: "round", x: 120, y: 120 },
    ["g-1", "g-2"],
  );
  assert.deepEqual(t.guestIds, ["g-1", "g-2"]);
  assert.equal(t.seatsLabel, "Table 1");
  assert.equal(t.x, 120);
});

test("null columns become undefined, not the string null", () => {
  const g = rowToGuest({
    id: "g-2", wedding_id: "w-1", household_id: "h-1",
    first_name: "Marc", last_name: "Petit",
    email: null, phone: null, status: "pending", table_id: null,
    is_child: false, is_plus_one: false, meal: "standard",
    dietary_flags: null, allergies: null, notes: null, guest_group: "other",
  });
  assert.equal(g.email, undefined);
  assert.equal(g.tableId, undefined);
  assert.deepEqual(g.dietaryFlags, []);
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `node --experimental-strip-types --test dashboard/src/lib/db/mappers.test.mjs`
Expected: FAIL — `Cannot find module './mappers.ts'`

- [ ] **Step 3: Écrire `mappers.ts`**

Un fichier, une fonction par sens et par domaine. Aucune logique métier : ces
fonctions renomment et rien d'autre. Les colonnes `null` deviennent
`undefined` (les types utilisent `?`, pas `| null`), sauf `dietary_flags` qui
devient `[]`.

Écrire chaque paire dans l'ordre de la liste « Produces » ci-dessus. Pour les
champs absents d'un type, ne pas les inventer : `dietary_requirements` n'est ni
lue ni écrite.

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `node --experimental-strip-types --test dashboard/src/lib/db/mappers.test.mjs`
Expected: PASS, 5 tests

- [ ] **Step 5: Écrire `current-wedding.ts`**

```ts
import { createClient } from "@/utils/supabase/server";

/**
 * Resolves the signed-in couple's wedding, the way every existing action in
 * this project does (see `rsvp-response-actions.ts`).
 *
 * The `wedding_id` this returns is still passed explicitly to every query's
 * `.eq("wedding_id", …)`. RLS already filters by owner, but a policy changed
 * by mistake must not be enough to expose another couple's data.
 */
export async function requireWedding() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!wedding) throw new Error("Wedding not found");

  return { supabase, user, weddingId: wedding.id as string };
}
```

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/lib/db/
git commit -m "feat(db): snake_case mappers and current-wedding resolution"
```

---

### Task 2: Projections — ce qui part au client

**Files:**
- Create: `dashboard/src/lib/db/projections.ts`
- Create: `dashboard/src/lib/db/projections.test.mjs`

**Interfaces:**
- Consumes: les types de Task 1.
- Produces:
  - `toSeatingGuest(g: InvitationGuest): SeatingGuest`
  - `toGroupsGuest(g: InvitationGuest): GroupsGuest`
  - `toMealsGuest(g: InvitationGuest): MealsGuest`
  - `toGroupsHousehold(h: Household): GroupsHousehold`
  - `visibleMedia(media: GuestMedia[]): GuestMedia[]`
  - et les quatre types `SeatingGuest`, `GroupsGuest`, `MealsGuest`,
    `GroupsHousehold` exportés depuis ce même fichier.

**Pourquoi cette tâche existe :** quatre composants client reçoivent
aujourd'hui des champs qu'ils n'affichent pas — email, téléphone, notes
privées, allergies, et jusqu'aux médias masqués. Ces fonctions sont la
frontière. Les tests ci-dessous échouent si un champ interdit réapparaît, ce
qui est le seul garde-fou automatique possible ici.

Ce qui reste autorisé : le prénom et le nom, quand l'écran consiste à
manipuler des invités nommés. Un plan de table sans noms est inutilisable.

- [ ] **Step 1: Écrire les tests de projection**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toSeatingGuest, toGroupsGuest, toMealsGuest, toGroupsHousehold, visibleMedia,
} from "./projections.ts";

const FULL_GUEST = {
  id: "g-1", firstName: "Élodie", lastName: "Moreau",
  email: "elodie@example.com", phone: "0600000000",
  householdId: "h-1", group: "friends",
  isChild: false, isPlusOne: false, status: "confirmed",
  meal: "vegetarian", dietaryFlags: ["gluten-free"],
  allergies: "arachides", notes: "témoin de la mariée",
  tableId: "t-1",
};

// Every field the seating board must never receive.
for (const forbidden of ["email", "phone", "notes", "allergies", "dietaryFlags", "meal"]) {
  test(`seating projection drops ${forbidden}`, () => {
    assert.ok(!(forbidden in toSeatingGuest(FULL_GUEST)));
  });
}

test("seating projection keeps what the board needs", () => {
  const s = toSeatingGuest(FULL_GUEST);
  assert.deepEqual(Object.keys(s).sort(),
    ["firstName", "id", "isChild", "lastName", "status", "tableId"]);
});

for (const forbidden of ["email", "phone", "notes", "allergies"]) {
  test(`groups projection drops ${forbidden}`, () => {
    assert.ok(!(forbidden in toGroupsGuest(FULL_GUEST)));
  });
}

// The meals screen displays allergies and dietary flags: they are its subject.
// Contact details and private notes are not.
for (const forbidden of ["email", "phone", "notes"]) {
  test(`meals projection drops ${forbidden}`, () => {
    assert.ok(!(forbidden in toMealsGuest(FULL_GUEST)));
  });
}

test("meals projection keeps the dietary fields it exists to show", () => {
  const m = toMealsGuest(FULL_GUEST);
  assert.equal(m.meal, "vegetarian");
  assert.deepEqual(m.dietaryFlags, ["gluten-free"]);
  assert.equal(m.allergies, "arachides");
});

test("household projection drops contact details", () => {
  const h = toGroupsHousehold({
    id: "h-1", name: "Famille Moreau", group: "family",
    email: "contact@example.com", phone: "0600000000",
    address: "12 rue des Lilas",
  });
  assert.ok(!("email" in h));
  assert.ok(!("phone" in h));
  assert.ok(!("address" in h));
  assert.equal(h.name, "Famille Moreau");
});

test("hidden media never reaches the client", () => {
  const media = [
    { id: "m-1", kind: "photo", url: "u1", uploadedAt: "2027-06-19", hidden: false },
    { id: "m-2", kind: "photo", url: "u2", uploadedAt: "2027-06-19", hidden: true },
  ];
  const visible = visibleMedia(media);
  assert.equal(visible.length, 1);
  assert.equal(visible[0].id, "m-1");
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `node --experimental-strip-types --test dashboard/src/lib/db/projections.test.mjs`
Expected: FAIL — module introuvable

- [ ] **Step 3: Écrire `projections.ts`**

Chaque fonction construit un objet littéral en nommant explicitement les
champs conservés. **Ne pas utiliser de déstructuration par rest**
(`const { email, ...rest } = g`) : un champ ajouté au type plus tard passerait
silencieusement dans `rest` et fuiterait. L'énumération explicite échoue de
façon visible à la place.

```ts
export type SeatingGuest = {
  id: string;
  firstName: string;
  lastName: string;
  isChild: boolean;
  status: RsvpStatus;
  tableId?: string;
};

/**
 * What the seating board is allowed to know. Names stay — a seating plan
 * without names cannot be used — but nothing else does: no contact details,
 * no private notes, no dietary information (that screen is `/guests/repas`).
 *
 * Written as an explicit literal rather than `{ email, ...rest }` on purpose:
 * a field added to `InvitationGuest` later must NOT flow through by default.
 */
export function toSeatingGuest(g: InvitationGuest): SeatingGuest {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    isChild: g.isChild,
    status: g.status,
    tableId: g.tableId,
  };
}
```

Suivre le même patron pour `toGroupsGuest` (garde `id`, `firstName`,
`lastName`, `householdId`, `group`, `isChild`, `isPlusOne`, `status`),
`toMealsGuest` (garde `id`, `firstName`, `lastName`, `householdId`, `isChild`,
`meal`, `dietaryFlags`, `allergies`), `toGroupsHousehold` (garde `id`, `name`,
`group`) et `visibleMedia` (filtre `hidden === false`).

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `node --experimental-strip-types --test dashboard/src/lib/db/projections.test.mjs`
Expected: PASS

- [ ] **Step 5: Vérifier que les tests mordent réellement**

Un test de confidentialité qui ne peut pas échouer ne protège rien. Ajouter
temporairement `email: g.email` dans `toSeatingGuest`, relancer, vérifier
qu'un test échoue, puis retirer la ligne et vérifier le retour au vert.
Consigner le résultat dans le rapport de tâche.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/lib/db/projections.ts dashboard/src/lib/db/projections.test.mjs
git commit -m "feat(db): client-facing projections that drop unshown guest fields"
```

---

### Task 3: Script de seed du mariage de démonstration

**Files:**
- Create: `scripts/seed-demo-wedding.mjs`
- Create: `scripts/README.md`

**Interfaces:**
- Consumes: `shared/data/jour-j-mock.ts` et `shared/data/invitation-mock.ts`
  — **dernier usage avant leur suppression en Task 9.** Le script lit le mock
  pour en faire des lignes, puis n'en dépendra plus (les valeurs seront
  recopiées en dur dans le script).
- Produces: un mariage peuplé, utilisable par toutes les tâches suivantes pour
  vérifier les écrans à la main.

**Pourquoi maintenant :** les tâches 4 à 8 branchent des écrans. Sans données,
elles ne peuvent vérifier que des états vides. Ce script doit donc exister
avant elles.

**Contraintes du spec §6 :**
- Prend un `wedding_id` en argument, **refuse de s'exécuter sans**.
- Refuse d'écrire si le mariage contient déjà des invités, sauf `--force`
  (qui purge d'abord).
- Utilise `SUPABASE_SERVICE_ROLE_KEY` (contournement RLS assumé, script
  d'administration local, jamais en CI).
- Ne crée pas de `guest_media` : pas de fichiers réels à mettre dans le
  bucket. L'écran photos montrera son état vide, qui est légitime.

- [ ] **Step 1: Écrire le script**

Structure attendue :

```js
#!/usr/bin/env node
/**
 * Seeds one wedding with the demo dataset (140 guests, 124 confirmed, 10
 * tables, menu, FAQ, venue) so the dashboard can be demonstrated and, more
 * importantly, so every wired screen is exercised against real rows.
 *
 * Administration script: run by hand, never from CI. It uses the service-role
 * key and therefore bypasses RLS.
 *
 *   node scripts/seed-demo-wedding.mjs <wedding_id> [--force]
 *
 * Refuses to run without an explicit wedding id: picking a wedding implicitly
 * is how you seed the wrong one.
 */
```

Lecture de l'environnement : chercher `NEXT_PUBLIC_SUPABASE_URL` et
`SUPABASE_SERVICE_ROLE_KEY` dans `dashboard/.env.local`, `dashboard/.env`,
`.env.local`, `.env`, dans cet ordre. Sortir avec un message clair si absents.

Garde-fous, dans cet ordre :
1. Pas d'argument → afficher l'usage, `process.exit(1)`.
2. Le `wedding_id` n'existe pas dans `weddings` → message explicite, sortie 1.
3. `guests` non vide pour ce mariage et pas de `--force` → message indiquant
   le nombre de lignes trouvées et la façon de forcer, sortie 1.
4. Avec `--force` → supprimer dans l'ordre inverse des dépendances
   (`guest_events`, `guests`, `households`, `tables`, `schedule_entries`,
   `events`, `venues`, `accommodations`, `faq_entries`, `menu_items`,
   `menu_categories`, `day_of_settings`), toujours filtré sur le
   `wedding_id` cible.

Insertion dans l'ordre des dépendances : `events` → `households` → `guests` →
`tables` → affectations (`guests.table_id`) → `guest_events` → `venues` →
`accommodations` → `faq_entries` → `menu_categories` → `menu_items` →
`day_of_settings`.

Le jeu de données reprend celui du mock : 140 invités dont 124 confirmés, 4 en
attente, 12 refus ; 10 tables de 12 places, 116 invités placés ; les 4
événements de juin 2027 (vendredi 18 dîner, **samedi 19 cérémonie**, dimanche
20 brunch, plus la soirée) ; le lieu, les hébergements, la FAQ et le menu du
mock. Recopier les valeurs dans le script — il ne doit pas importer le mock,
qui sera supprimé.

Les ids sont laissés à Postgres (`gen_random_uuid()`), pas repris du mock
(`g-1`, `t-1`… ne sont pas des UUID). Le script garde une table de
correspondance en mémoire pour relier invités, foyers et tables.

Afficher un récapitulatif final : nombre de lignes insérées par table.

- [ ] **Step 2: Vérifier les garde-fous, un par un**

```bash
node scripts/seed-demo-wedding.mjs                      # usage, exit 1
node scripts/seed-demo-wedding.mjs 00000000-0000-0000-0000-000000000000
                                                        # mariage inconnu, exit 1
```

Expected: les deux échouent proprement, sans toucher la base.

- [ ] **Step 3: Peupler pour de vrai**

Choisir un `wedding_id` réel (`select id from weddings limit 1` via le script
de contrôle, ou l'interface Supabase). Lancer le seed, puis vérifier les
comptes :

```
guests 140, tables 10, households ~60, events 4, guest_events >0,
venues 1, accommodations >0, faq_entries >0, menu_categories 6, menu_items >0,
day_of_settings 1
```

Vérifier aussi que 116 invités ont un `table_id` non nul et 124 sont
`confirmed`. Consigner le `wedding_id` utilisé dans le rapport : les tâches
suivantes en ont besoin.

- [ ] **Step 4: Vérifier l'idempotence du refus**

Relancer le script sur le même mariage sans `--force` : il doit refuser en
nommant le nombre d'invités trouvés. Puis avec `--force` : il doit purger et
réinsérer, et les comptes doivent être identiques (pas doublés).

- [ ] **Step 5: Écrire `scripts/README.md`**

La commande exacte, ce que le script fait, l'avertissement sur la clé
`service_role`, et le fait qu'il ne crée pas de médias.

- [ ] **Step 6: Commit**

```bash
git add scripts/
git commit -m "feat(scripts): seed a demo wedding with the full dataset"
```

---

### Task 4: Écrans Invitation — événements et programme

**Files:**
- Create: `dashboard/src/actions/events-actions.ts`
- Create: `dashboard/src/actions/schedule-actions.ts`
- Modify: `dashboard/src/app/[locale]/invitation/evenements/page.tsx`
- Modify: `dashboard/src/app/[locale]/invitation/programme/page.tsx`
- Modify: `dashboard/src/components/invitation/EventsEditor.tsx`
- Modify: `dashboard/src/components/invitation/ScheduleEditor.tsx`

**Interfaces:**
- Consumes: `requireWedding()`, `rowToEvent`/`eventToRow`,
  `rowToScheduleEntry`/`scheduleEntryToRow` (Task 1).
- Produces: le patron d'action que les tâches 5 à 8 reprennent —
  `"use server"`, `requireWedding()`, requête filtrée, `revalidatePath`,
  retour `{ ok: true }` ou lancement d'une `Error` dont le message est
  affichable.

**État actuel :** `EventsEditor` et `ScheduleEditor` mutent un `useState`
local, sans persistance. Les pages passent `initialEvents` /
`initialSchedule` depuis le mock.

- [ ] **Step 1: Écrire `events-actions.ts`**

Quatre actions : `listEvents()`, `createEvent(input)`, `updateEvent(id, patch)`,
`deleteEvent(id)`, `reorderEvents(ids: string[])`.

`listEvents` est appelée depuis la page (Server Component) ; les autres depuis
le composant client.

```ts
"use server";

import { requireWedding } from "@/lib/db/current-wedding";
import { rowToEvent, eventToRow } from "@/lib/db/mappers";
import { revalidatePath } from "next/cache";
import type { WeddingEvent } from "@shared/types/invitation";

export async function listEvents(): Promise<WeddingEvent[]> {
  const { supabase, weddingId } = await requireWedding();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    // Explicit even though RLS already filters by owner — see the plan's
    // global constraints.
    .eq("wedding_id", weddingId)
    .order("position", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToEvent);
}
```

`reorderEvents` écrit les nouvelles positions en une seule requête `upsert`
plutôt qu'une par ligne : le glisser-déposer réordonne potentiellement toute
la liste.

`deleteEvent` : `schedule_entries.event_id` a `on delete cascade`, donc les
entrées de programme liées partent avec l'événement. Le composant doit
prévenir l'utilisateur avant, comme le veut la convention du projet
(confirmation avant suppression).

- [ ] **Step 2: Écrire `schedule-actions.ts`**

Même forme : `listSchedule()`, `createScheduleEntry`, `updateScheduleEntry`,
`deleteScheduleEntry`, `reorderScheduleEntries`.

`createScheduleEntry` exige un `eventId` : une entrée de programme appartient
à un événement (c'est ce qui évite qu'un brunch s'affiche entre la cérémonie
et le dîner).

- [ ] **Step 3: Brancher les deux pages**

Remplacer l'import du mock par un appel à l'action. Les pages sont déjà des
Server Components ; elles deviennent `async` si elles ne le sont pas.

```tsx
// avant
import { INVITATION_MOCK } from "@shared/data/invitation-mock";
...
<EventsEditor initialEvents={INVITATION_MOCK.events} />

// après
import { listEvents } from "@/actions/events-actions";
...
const events = await listEvents();
<EventsEditor initialEvents={events} />
```

La prop ne change pas de forme : c'est tout l'intérêt d'avoir construit sur
mock.

- [ ] **Step 4: Brancher les composants**

Dans `EventsEditor`, chaque mutation locale appelle l'action correspondante.
Patron optimiste :

```tsx
const onToggleEnabled = async (id: string, enabled: boolean) => {
  const previous = events;
  setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, enabled } : e)));
  try {
    await updateEvent(id, { enabled });
  } catch (err) {
    // Put the row back the way it was: a silent failure here means the couple
    // thinks an event is published when it is not.
    setEvents(previous);
    toast.error(t("save_failed"));
  }
};
```

Ajouter la clé `save_failed` dans les 9 locales
(`dashboard/messages/{fr,en,de,es,pt,it,ar,zh,ja}.json`), sous la section déjà
utilisée par ces écrans.

- [ ] **Step 5: Vérifier à la main sur le mariage de démonstration**

Lancer `npm run dev:dashboard`. Sur `/fr/invitation/evenements` : créer,
renommer, désactiver, réordonner, supprimer un événement. **Recharger la page
après chaque opération** : c'est le seul moyen de distinguer un état local
d'une écriture réelle. Idem sur `/fr/invitation/programme`.

Vérifier à 375 px et à 1440 px.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/actions/events-actions.ts \
        dashboard/src/actions/schedule-actions.ts \
        "dashboard/src/app/[locale]/invitation/evenements/page.tsx" \
        "dashboard/src/app/[locale]/invitation/programme/page.tsx" \
        dashboard/src/components/invitation/EventsEditor.tsx \
        dashboard/src/components/invitation/ScheduleEditor.tsx \
        dashboard/messages/
git commit -m "feat(invitation): wire events and schedule to Supabase"
```

---

### Task 5: Écrans Invitation — lieu et FAQ

**Files:**
- Create: `dashboard/src/actions/venue-actions.ts`
- Create: `dashboard/src/actions/faq-actions.ts`
- Modify: `dashboard/src/app/[locale]/invitation/lieu/page.tsx`
- Modify: `dashboard/src/app/[locale]/invitation/faq/page.tsx`
- Modify: `dashboard/src/components/invitation-info/LieuPageClient.tsx`
- Modify: `dashboard/src/components/invitation-info/FaqPageClient.tsx`

**Interfaces:**
- Consumes: le patron d'action de Task 4, `rowToVenue`/`venueToRow`,
  `rowToAccommodation`/`accommodationToRow`, `rowToFaqEntry`/`faqEntryToRow`.
- Produces: `uploadVenuePhoto(file)` → `string` (URL publique), réutilisé par
  les hébergements.

- [ ] **Step 1: Écrire `venue-actions.ts`**

`getVenue()` renvoie `Venue | null` — un couple qui n'a pas encore saisi son
lieu n'a pas de ligne. `upsertVenue(patch)` crée ou met à jour : la table a une
ligne par mariage.

`listAccommodations()`, `createAccommodation`, `updateAccommodation`,
`deleteAccommodation`, `reorderAccommodations`.

`uploadVenuePhoto(formData)` : le `PhotoPicker` produit aujourd'hui une URL
`blob:` locale. L'action reçoit le fichier, le dépose dans le bucket **`venue`,
qui existe déjà** (vérifié dans `supabase/migrations` — ne pas en créer un
nouveau), et renvoie l'URL publique. Conserver le plafond de 8 Mo et les types
JPEG/PNG/WebP déjà appliqués côté client, **et les revérifier côté serveur** :
une validation seulement cliente ne valide rien.

Les photos d'hébergement vont dans le même bucket, sous un préfixe distinct
(`<wedding_id>/accommodations/…` contre `<wedding_id>/venue/…`) pour rester
rangées.

- [ ] **Step 2: Écrire `faq-actions.ts`**

`listFaq()`, `createFaqEntry`, `updateFaqEntry`, `deleteFaqEntry`,
`reorderFaqEntries`, `setFaqPublished(id, published)`.

- [ ] **Step 3: Brancher les pages et les composants**

Même patron optimiste que Task 4. `LieuPageClient` gère trois états
(`venue`, `accommodation`, plus la photo) : chacun doit revenir en arrière
indépendamment en cas d'échec.

- [ ] **Step 4: Vérifier à la main**

`/fr/invitation/lieu` : saisir le lieu, téléverser une photo, ajouter et
réordonner deux hébergements, recharger à chaque fois. Vérifier que la photo
survit au rechargement — une URL `blob:` ne survit pas, c'est le symptôme d'un
téléversement non branché.

`/fr/invitation/faq` : créer, éditer, masquer, réordonner, supprimer.

Vérifier à 375 px et à 1440 px.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/actions/venue-actions.ts dashboard/src/actions/faq-actions.ts \
        "dashboard/src/app/[locale]/invitation/lieu/page.tsx" \
        "dashboard/src/app/[locale]/invitation/faq/page.tsx" \
        dashboard/src/components/invitation-info/
git commit -m "feat(invitation): wire venue, stays and FAQ to Supabase"
```

---

### Task 6: Écrans Invités — groupes et repas

**Files:**
- Create: `dashboard/src/actions/guest-groups-actions.ts`
- Create: `dashboard/src/actions/guest-meals-actions.ts`
- Modify: `dashboard/src/app/[locale]/guests/groupes/page.tsx`
- Modify: `dashboard/src/app/[locale]/guests/repas/page.tsx`
- Modify: `dashboard/src/components/guests/GuestGroupsBoard.tsx`
- Modify: `dashboard/src/components/guests/GuestMealsBoard.tsx`

**Interfaces:**
- Consumes: `toGroupsGuest`, `toMealsGuest`, `toGroupsHousehold` (Task 2) —
  **obligatoires**, c'est la tâche où la contrainte de confidentialité se joue.
- Produces: —

**Attention :** ces deux écrans reçoivent aujourd'hui `InvitationGuest[]`
complet, avec email, téléphone, allergies et notes privées, dans un composant
`"use client"`. Les pages doivent projeter **avant** de passer la prop. Les
types de prop des deux composants changent en conséquence
(`GroupsGuest[]` / `MealsGuest[]` au lieu de `InvitationGuest[]`), et le
compilateur signalera tout champ devenu inaccessible — ce qui est exactement
le retour attendu : si le composant lisait `guest.email`, il ne devait pas.

- [ ] **Step 1: Écrire `guest-groups-actions.ts`**

`listGroupsData()` renvoie `{ guests: GroupsGuest[]; households: GroupsHousehold[] }`
— déjà projeté. `updateGuestGroup(id, group)`, `assignHousehold(guestId, householdId)`,
`createHousehold(input)`, `updateHousehold(id, patch)`, `deleteHousehold(id)`.

`deleteHousehold` : `guests.household_id` est déclaré
`on delete set null` (vérifié dans `00000000000000_full_db_reset.sql:158`).
Supprimer un foyer **détache** donc ses invités au lieu de les supprimer —
c'est le comportement voulu, rien à contourner. La confirmation affichée à
l'utilisateur doit le dire explicitement : « les invités de ce foyer ne seront
pas supprimés, ils seront détachés », sinon le couple craindra de perdre des
invités et n'utilisera pas le bouton.

- [ ] **Step 2: Écrire `guest-meals-actions.ts`**

`listMealsData()` renvoie `{ guests: MealsGuest[]; households: GroupsHousehold[] }`.
`updateGuestMeal(id, meal)`, `toggleDietaryFlag(id, flag)`,
`updateAllergies(id, text)`.

`toggleDietaryFlag` lit le tableau courant, ajoute ou retire, réécrit. Le faire
côté serveur et non côté client : deux onglets ouverts sur le même invité ne
doivent pas s'écraser sur un tableau périmé.

- [ ] **Step 3: Brancher les pages avec projection**

```tsx
// La page projette avant de passer la prop : le composant client ne reçoit
// jamais email, téléphone ni notes.
const { guests, households } = await listGroupsData();
<GuestGroupsBoard initialGuests={guests} households={households} />
```

- [ ] **Step 4: Adapter les composants aux types projetés**

Changer les types de prop. Corriger ce que le compilateur signale : tout accès
à un champ retiré était une fuite.

Conserver les cibles tactiles à 44 px sur les bascules de régime — c'est un
correctif déjà appliqué (840 cibles à 32 px trouvées et corrigées à l'étape 1),
ne pas le perdre.

- [ ] **Step 5: Vérifier à la main, et vérifier le bundle**

`/fr/guests/groupes` et `/fr/guests/repas` : changer un groupe, un foyer, un
repas, une allergie, un drapeau de régime. Recharger à chaque fois.

Puis, la vérification qui compte :

```bash
npm run build:dashboard
grep -rl "elodie@example\|0600000000" dashboard/.next/static/chunks/ || echo "aucun contact invité dans le bundle"
```

Adapter les motifs aux vraies valeurs du mariage de démonstration. Chercher un
email et un numéro réellement présents en base. Consigner le résultat dans le
rapport.

Vérifier à 375 px et à 1440 px.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/actions/guest-groups-actions.ts \
        dashboard/src/actions/guest-meals-actions.ts \
        "dashboard/src/app/[locale]/guests/" \
        dashboard/src/components/guests/
git commit -m "feat(guests): wire groups and meals, projecting away unshown fields"
```

---

### Task 7: Jour J — plan de table, menu, paramètres, QR code

**Files:**
- Create: `dashboard/src/actions/seating-actions.ts`
- Create: `dashboard/src/actions/menu-actions.ts`
- Create: `dashboard/src/actions/day-of-settings-actions.ts`
- Modify: `dashboard/src/app/[locale]/jour-j/plan-de-table/page.tsx`
- Modify: `dashboard/src/app/[locale]/jour-j/menu/page.tsx`
- Modify: `dashboard/src/app/[locale]/jour-j/parametres/page.tsx`
- Modify: `dashboard/src/app/[locale]/jour-j/qr-code/page.tsx`
- Modify: `dashboard/src/components/jour-j/seating/SeatingScreen.tsx`
- Modify: `dashboard/src/components/jour-j/menu/MenuEditor.tsx`
- Modify: `dashboard/src/components/jour-j/settings/DayOfSettingsForm.tsx`

**Interfaces:**
- Consumes: `toSeatingGuest` (Task 2), `rowToTable`, `rowToMenuCategory`.
- Produces: —

**Décision du spec §3.4 :** écriture optimiste à chaque geste, pas de bouton
« Enregistrer ». Le déplacement de table est débattu à 400 ms.

- [ ] **Step 1: Écrire `seating-actions.ts`**

`listSeating()` renvoie `{ tables: DayOfTable[]; guests: SeatingGuest[] }`.
Les `guestIds` de chaque table se reconstruisent depuis `guests.table_id` :
une seule requête sur `guests`, puis regroupement en mémoire — pas une requête
par table.

`assignGuestToTable(guestId, tableId)` : vérifier la capacité côté serveur
avant d'écrire. Un client qui contourne l'interface ne doit pas pouvoir
asseoir 15 personnes à une table de 12.

`unassignGuest(guestId)` : `table_id = null`.

`moveTable(tableId, x, y)` : écrit `tables.x` / `tables.y`.

- [ ] **Step 2: Brancher `SeatingScreen`**

Le composant garde son `useState` (l'affichage optimiste en dépend) mais chaque
mutation appelle l'action et revient en arrière en cas d'échec.

```tsx
const onAssign = async (guestId: string, tableId: string) => {
  const previous = tables;
  setTables((prev) => assignGuest(prev, guestId, tableId));
  try {
    await assignGuestToTable(guestId, tableId);
  } catch (err) {
    setTables(previous);
    toast.error(t("assign_failed"));
  }
};
```

Le déplacement de table est débattu : un glissement produit des dizaines
d'événements, un seul mérite d'être écrit.

```tsx
// A drag fires dozens of move events; only the last one is worth a round trip.
const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const onMoveTable = (tableId: string, x: number, y: number) => {
  setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, x, y } : t)));
  if (moveTimer.current) clearTimeout(moveTimer.current);
  moveTimer.current = setTimeout(() => {
    void moveTable(tableId, x, y).catch(() => toast.error(t("move_failed")));
  }, 400);
};
```

Le sensor reste `PointerSensor` avec `distance: 8` — vérifié à l'étape 1,
`MouseSensor` ne s'active pas dans ce projet. Ne pas y toucher.

- [ ] **Step 3: Écrire `menu-actions.ts` et brancher le menu**

`listMenu()` renvoie `MenuCategory[]` avec leurs `items` (une requête sur
`menu_categories`, une sur `menu_items`, jointure en mémoire).
`toggleCategory(id, enabled)`, `createMenuItem`, `updateMenuItem`,
`deleteMenuItem`, `reorderMenuItems`.

`menu_items` n'a pas de `wedding_id` : il passe par `category_id`. Les actions
doivent donc vérifier que la catégorie appartient bien au mariage courant avant
d'écrire — la RLS le fait déjà via sa sous-requête, mais le filtre applicatif
reste écrit (contrainte globale).

- [ ] **Step 4: Écrire `day-of-settings-actions.ts` et brancher paramètres + QR**

`getDayOfSettings()` renvoie `DayOfSettings`. Le `qrSlug` vient de
`sites.slug` — une requête sur `sites` filtrée par `wedding_id`, pas une
colonne de `day_of_settings` (spec §2.1).

Si aucune ligne `day_of_settings` n'existe, renvoyer des valeurs par défaut
(`enabled: false`) sans créer la ligne : la création a lieu à la première
écriture.

`updateDayOfSettings(patch)` fait un `upsert` sur `wedding_id`.

`uploads_open_until` est un `timestamptz`. Le correctif de l'étape 1 tient
toujours : une date de champ `<input type="date">` doit devenir
`${jour}T23:59:59.999Z` et non passer par `new Date(jour).toISOString()`, qui
ramènerait l'échéance à minuit. Garder la garde sur la chaîne vide.

La page QR code lit le slug via `getDayOfSettings()`. Elle génère déjà le SVG
et le PNG côté serveur : rien à changer de ce côté.

- [ ] **Step 5: Vérifier à la main**

`/fr/jour-j/plan-de-table` **à 1440 px au minimum** — en dessous de 768 px
c'est la vue mobile qui s'affiche, et le canvas n'est pas monté du tout (piège
rencontré à l'étape 1). Déposer un invité sur une table, **recharger**,
vérifier que l'affectation a tenu. Déplacer une table, recharger, vérifier la
position. Retirer un invité, recharger.

Puis à 375 px : la vue liste, taper pour affecter, recharger.

Tester le refus de capacité : remplir une table à 12/12 et tenter une 13ᵉ
dépose. Le serveur doit refuser et l'affichage revenir en arrière.

`/fr/jour-j/menu`, `/fr/jour-j/parametres`, `/fr/jour-j/qr-code` : chaque
écriture suivie d'un rechargement. Vérifier que l'URL du QR ne change pas
entre deux rechargements — c'est l'exigence du code permanent.

- [ ] **Step 6: Commit**

```bash
git add dashboard/src/actions/seating-actions.ts \
        dashboard/src/actions/menu-actions.ts \
        dashboard/src/actions/day-of-settings-actions.ts \
        "dashboard/src/app/[locale]/jour-j/" \
        dashboard/src/components/jour-j/
git commit -m "feat(jour-j): wire seating, menu, settings and QR to Supabase"
```

---

### Task 8: Jour J — photos, accueil et statistiques

**Files:**
- Create: `dashboard/src/actions/guest-media-actions.ts`
- Create: `dashboard/src/actions/dashboard-summary-actions.ts`
- Modify: `dashboard/src/app/[locale]/jour-j/photos/page.tsx`
- Modify: `dashboard/src/app/[locale]/page.tsx`
- Modify: `dashboard/src/app/[locale]/stats/page.tsx`
- Modify: `dashboard/src/components/jour-j/media/MediaGrid.tsx`

**Interfaces:**
- Consumes: `visibleMedia` (Task 2), `rowToGuestMedia`.
- Produces: —

- [ ] **Step 1: Écrire `guest-media-actions.ts`**

`listGuestMedia()` : lit `guest_media`, construit une **URL signée** par
fichier côté serveur, et renvoie les médias. Le `storage_path` brut ne part pas
au client (spec §5).

Le dashboard voit les médias masqués (c'est lui qui les masque) mais la page
invité non : `visibleMedia` s'applique côté page invité, pas ici. Le dashboard
reçoit donc tout, avec le drapeau `hidden`.

`setMediaHidden(id, hidden)`.

`deleteMedia(id)` : supprimer la ligne **et** l'objet du bucket. Une ligne
supprimée sans son fichier laisse un objet orphelin, payant et toujours
joignable par URL signée. Supprimer l'objet d'abord, puis la ligne : l'inverse
laisserait un fichier introuvable si la seconde opération échoue.

- [ ] **Step 2: Écrire `dashboard-summary-actions.ts`**

`getDashboardSummary()` renvoie **uniquement des agrégats** :

```ts
{
  weddingDate: string | null;
  coupleNames: { first: string; second: string } | null;
  guests: { total: number; confirmed: number; pending: number; children: number };
  seating: { seated: number; toSeat: number };
  media: { total: number };
  dayOf: { enabled: boolean; qrSlug: string | null };
}
```

Les noms viennent de `profiles` (`first_name`, `last_name`, `partner_name`),
pas de `weddings`, qui n'en a pas (spec §2.2). La date vient de
`weddings.wedding_date`.

Les comptes se font par `select("*", { count: "exact", head: true })` avec les
filtres appropriés — pas en chargeant 140 lignes pour les compter côté serveur.

`getStatsSummary()` renvoie les agrégats de l'écran statistiques : comptes RSVP,
taux de réponse, et une ligne par événement activé (`id`, `name`, `confirmed`,
`total`) construite depuis `guest_events`.

**Les visites restent fictives.** Aucune table ne les porte. Garder la valeur
en dur dans la page avec un commentaire nommant la raison, et ne pas inventer
de schéma de mesure d'audience.

- [ ] **Step 3: Brancher les trois pages**

L'accueil et les statistiques ne passent que des nombres à leurs composants :
ils suivent déjà le bon modèle, seule la source change.

`MediaGrid` reçoit les médias avec URL signée. Vérifier que le composant
n'affiche pas `storage_path`.

- [ ] **Step 4: Vérifier à la main**

`/fr` : la date du mariage s'affiche et le compte à rebours est cohérent. Les
compteurs correspondent au jeu de démonstration (140 / 124 / 4 / 116).
Modifier la date dans les réglages, revenir, vérifier.

`/fr/stats` : les comptes correspondent. Les visites affichent leur valeur
fictive, ce qui est attendu.

`/fr/jour-j/photos` : l'écran est **vide**, le seed ne crée pas de médias.
C'est l'état attendu et il doit être présentable, pas cassé. Si un bucket
contient déjà des fichiers de test, vérifier masquage et suppression ; sinon,
consigner que ce chemin n'a pas pu être exercé faute de fichiers.

Vérifier à 375 px et à 1440 px.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/actions/guest-media-actions.ts \
        dashboard/src/actions/dashboard-summary-actions.ts \
        "dashboard/src/app/[locale]/page.tsx" \
        "dashboard/src/app/[locale]/stats/page.tsx" \
        "dashboard/src/app/[locale]/jour-j/photos/page.tsx" \
        dashboard/src/components/jour-j/media/MediaGrid.tsx
git commit -m "feat(dashboard): wire media, home summary and stats to Supabase"
```

---

### Task 9: Page invité anonyme et suppression du mock

**Files:**
- Create: `landing/src/actions/guest-page-actions.ts`
- Modify: `landing/src/app/[locale]/jourj/[slug]/layout.tsx`
- Modify: `landing/src/app/[locale]/jourj/[slug]/page.tsx`
- Modify: `landing/src/app/[locale]/jourj/[slug]/menu/page.tsx`
- Modify: `landing/src/components/jourj/TableFinder.tsx`
- Modify: `landing/src/components/jourj/PhotoUpload.tsx`
- Delete: `shared/data/jour-j-mock.ts`
- Delete: `shared/data/invitation-mock.ts`

**Interfaces:**
- Consumes: la RPC `search_guest_table` (**à ne pas modifier**).
- Produces: —

**C'est la tâche sensible.** `TableFinder` est aujourd'hui `"use client"`,
importe le mock et exécute `searchSeatedGuests` dans le navigateur : la liste
complète des invités part vers quiconque scanne le QR code.

- [ ] **Step 1: Écrire `guest-page-actions.ts`**

```ts
"use server";

/**
 * The anonymous guest page's only route into the guest list.
 *
 * This calls `search_guest_table`, a security-definer RPC that enforces the
 * 2-character minimum, the 5-row cap, the confirmed+seated filter and a
 * four-column result. `guests` has no anon select policy and must never get
 * one — see cahier §16 and the warning in
 * supabase/migrations/README-step-2.md.
 */
export async function searchMyTable(slug: string, query: string) { … }
```

L'action résout d'abord `slug → sites.wedding_id`, puis appelle la RPC. Elle ne
renvoie que les quatre colonnes de la RPC.

Ajouter aussi `getGuestPageData(slug)` : les événements activés, le menu des
catégories activées, et les paramètres du jour J — tout ce que la page invité
affiche, en lecture anonyme, sans aucune donnée nominative.

- [ ] **Step 2: Brancher le layout sur `sites.slug`**

Le layout compare aujourd'hui `slug` au mock. Il doit résoudre
`sites.slug → wedding_id`, puis lire `day_of_settings.enabled`. Slug inconnu ou
module désactivé → `notFound()`.

- [ ] **Step 3: Vider `TableFinder` de toute donnée d'invité**

Le composant reste client (il gère la saisie) mais n'importe plus rien. Chaque
recherche appelle `searchMyTable`. Débattre la saisie à 300 ms pour ne pas
lancer une requête par frappe.

Garder le minimum de 2 caractères côté client pour le retour visuel
(« Encore une lettre… »), mais **c'est la RPC qui l'applique réellement** — une
validation cliente ne valide rien.

- [ ] **Step 4: Brancher `PhotoUpload` et la page menu**

`PhotoUpload` dépose dans le bucket `guest-media` et insère la ligne. Les
policies anonymes existent déjà et sont conditionnées par
`uploads_open_until` : si la fenêtre est fermée, l'insertion échoue côté base.
Afficher un message clair plutôt qu'une erreur brute.

- [ ] **Step 5: Supprimer les deux fichiers de mock**

```bash
git rm shared/data/jour-j-mock.ts shared/data/invitation-mock.ts
```

`shared/lib/seating.ts` et ses 13 tests **restent** : la fonction cesse d'être
le chemin de la page invité mais continue de verrouiller la règle côté code, et
le dashboard s'en sert pour sa propre recherche (spec §3.3).

- [ ] **Step 6: Vérifier qu'il ne reste aucune référence**

```bash
grep -rn "jour-j-mock\|invitation-mock" --include="*.ts" --include="*.tsx" . \
  | grep -v node_modules | grep -v "\.next"
```
Expected: aucune sortie.

- [ ] **Step 7: Vérifier le bundle de la page invité**

La vérification qui justifie toute la tâche :

```bash
npm run build:landing
# Chercher un nom d'invité réel du jeu de démonstration dans les chunks.
grep -rl "<un nom d'invité réel>" landing/.next/static/chunks/ \
  || echo "aucune donnée invité dans le bundle client"
```

Consigner le résultat exact dans le rapport, avec le nom cherché.

- [ ] **Step 8: Vérifier la page invité à la main**

Sur téléphone ou à 375 px : scanner l'URL `/fr/jourj/<slug>`, chercher un
invité placé (doit trouver sa table), un invité non placé (ne doit rien
trouver), un invité en attente (ne doit rien trouver), une chaîne d'un seul
caractère (ne doit rien trouver), et une chaîne qui correspond à plus de cinq
invités (doit en afficher cinq au plus).

Vérifier qu'un slug inconnu donne bien une page 404.

- [ ] **Step 9: Commit**

```bash
git add landing/src/ shared/data/
git commit -m "feat(jourj): guest page reads through the search RPC; drop the mocks"
```

---

### Task 10: Vérification finale

**Files:** aucun fichier créé ; corrections là où la vérification échoue.

- [ ] **Step 1: Tous les tests**

```bash
node --experimental-strip-types --test shared/lib/seating.test.mjs \
  dashboard/src/lib/db/mappers.test.mjs \
  dashboard/src/lib/db/projections.test.mjs
```
Expected: les 13 tests de seating plus les nouveaux, aucun échec.

- [ ] **Step 2: Les deux builds**

```bash
npm run build:dashboard && echo "dashboard OK"
npm run build:landing && echo "landing OK"
```
Expected: code de sortie 0 pour les deux. Vérifier le code de sortie, pas
seulement l'absence de message d'erreur à l'écran.

- [ ] **Step 3: Les critères d'acceptation du spec, un par un**

Reprendre le §9 du spec et vérifier les sept points. Pour le point 3, chercher
dans `dashboard/.next/static/chunks` un email, un téléphone, une note privée et
une allergie réellement présents dans le mariage de démonstration. Consigner
les motifs cherchés et le résultat.

- [ ] **Step 4: Revue des restes de mock assumés**

Un seul est admis : les visites de l'écran statistiques. Vérifier qu'il est
annoté et qu'aucun autre n'a survécu.

- [ ] **Step 5: Commit final s'il y a des corrections**

```bash
git commit -m "fix(wiring): address final verification findings"
```

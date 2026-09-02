# Navigation 6 sections & module Jour J (mock) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructurer la navigation du dashboard en six sections, puis livrer
tous les écrans du module Jour J sur données fictives — jusqu'au point où le
client peut valider l'UX avant qu'on écrive la moindre migration.

**Architecture:** Les types du Jour J vivent dans `shared/types/jour-j.ts` et
sont définitifs dès maintenant; les données fictives dans
`shared/data/jour-j-mock.ts`, importées par le dashboard *et* par la page
invité de `landing/` via l'alias `@shared/*` déjà configuré dans les deux
`tsconfig.json`. La logique de placement (capacité, invités non placés,
compteurs) est extraite en fonctions pures testables, séparées des composants
React. À l'étape 2, on supprimera le seul fichier de mock et on branchera
Supabase : aucun composant ne changera.

**Tech Stack:** Next.js 16 (App Router), React 19, next-intl 4, Tailwind 3 +
preset `shared/tailwind-preset.js`, `@dnd-kit` (déjà installé), `qrcode` (à
installer), `node:test` pour les tests unitaires.

**Spec:** `docs/superpowers/specs/2026-09-01-back-office-maries-jour-j-design.md`

## Global Constraints

- **Mobile-first, non négociable.** Chaque écran se dessine à 375 px d'abord.
  Aucun scroll horizontal. Cibles tactiles ≥ 44 px. Le plan de table et la
  galerie ont une conception mobile *distincte*, pas un empilement du desktop.
- **Langues** : code, commentaires et commits en anglais. UI en français via
  next-intl. Les neuf locales existent : `fr en de es pt it ar zh ja`. `fr`
  fait foi; les huit autres sont traduites dans la même tâche, jamais laissées
  en anglais ni vides.
- **Design tokens** : uniquement ceux de `shared/tailwind-preset.js` —
  `studio-violet #4B3F72`, `studio-lavande #B7AFD1`, `studio-creme #FFFDE8`,
  `studio-jaune #F2E5AA`, `studio-beige #E6DCC6`. Pas de couleur en dur.
- **Pas de variable CSS `--destructive`** dans ce projet : un bouton destructif
  s'écrit `className="bg-red-500 hover:bg-red-600 text-white"`.
- **Server Components par défaut**, `"use client"` seulement pour l'état local
  et les hooks.
- **Pas de `href="#ancre"`** — provoque un scroll au rafraîchissement.
- **Aucune migration SQL, aucun appel Supabase** dans ce plan. Tout est mock.
- **Tests** : runner `node:test` (natif, aucune dépendance à installer). Il ne
  teste que de la logique pure — pas de rendu React.
- Le module Jour J est **inclus pour tous**, activable par un réglage. Pas de
  paywall, pas d'entrée dans `APP_MODULES`.

---

## File Structure

**Partagé (les deux apps le lisent) :**
- `shared/types/jour-j.ts` — types. Permanents, survivent au mock.
- `shared/data/jour-j-mock.ts` — données fictives. **Supprimé à l'étape 2.**
- `shared/lib/seating.ts` — logique pure de placement. Permanente.

**Dashboard — navigation :**
- `dashboard/src/components/navigation/nav-config.ts` — l'arbre des 6 sections.
- `dashboard/src/components/navigation/NavSection.tsx` — section repliable.
- `dashboard/src/components/navigation/ComingSoon.tsx` — page non construite.
- `dashboard/src/components/dashboard/Sidebar.tsx` — **modifié**.

**Dashboard — écrans Jour J :**
- `dashboard/src/app/[locale]/jour-j/{plan-de-table,qr-code,menu,photos,parametres}/page.tsx`
- `dashboard/src/components/jour-j/seating/` — `SeatingBoard` (desktop),
  `SeatingList` (mobile), `TableCard`, `UnseatedPanel`, `AssignGuestsSheet`,
  `SeatingHeader`.
- `dashboard/src/components/jour-j/qr/QrCodePanel.tsx`
- `dashboard/src/components/jour-j/menu/{MenuEditor,MenuCategoryCard}.tsx`
- `dashboard/src/components/jour-j/media/{MediaGrid,MediaTile}.tsx`
- `dashboard/src/components/jour-j/settings/DayOfSettingsForm.tsx`

**Landing — page invité :**
- `landing/src/app/[locale]/jourj/[slug]/{page,ma-table,menu,photos}/…`

**Tests :**
- `shared/lib/seating.test.mjs`

---

## Task 1: Types partagés et données fictives

**Files:**
- Create: `shared/types/jour-j.ts`
- Create: `shared/data/jour-j-mock.ts`

**Interfaces:**
- Consumes: rien (première tâche).
- Produces: les types `DayOfTable`, `DayOfGuest`, `MenuCategory`, `MenuItem`,
  `GuestMedia`, `DayOfSettings`, `DayOfData`; et la constante
  `JOUR_J_MOCK: DayOfData`. Toutes les tâches suivantes en dépendent.

- [ ] **Step 1: Écrire les types**

Créer `shared/types/jour-j.ts` :

```ts
/**
 * The day-of module's data shape — shared by the couple's dashboard and the
 * guest-facing page in `landing/`.
 *
 * These types are final: step 1 fills them from a mock file, step 2 fills them
 * from Supabase, and no component in between knows the difference.
 */

export type TableShape = "round" | "rectangle" | "long";

/** A guest, reduced to what the day-of screens actually render. */
export type DayOfGuest = {
  id: string;
  firstName: string;
  lastName: string;
  isChild: boolean;
  /** Only confirmed guests are seatable and searchable from the QR page. */
  status: "pending" | "confirmed" | "declined";
  /** Free text for now; step 4 structures it. */
  dietary?: string;
};

export type DayOfTable = {
  id: string;
  /** "Capri" — the display name the guest sees after scanning. */
  name: string;
  /** "Table 12" — an optional second label printed on the table itself. */
  seatsLabel?: string;
  shape: TableShape;
  capacity: number;
  /** Canvas position, desktop only. Mobile orders by `position`. */
  x: number;
  y: number;
  position: number;
  guestIds: string[];
};

export const MENU_CATEGORY_KEYS = [
  "cocktail",
  "starter",
  "main",
  "cheese",
  "dessert",
  "drinks",
] as const;

export type MenuCategoryKey = (typeof MENU_CATEGORY_KEYS)[number];

/**
 * `variant` is carried from day one but not exposed in V1: the spec defers
 * per-guest menus to a later phase, and having the field now means that phase
 * needs no migration.
 */
export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  variant?: "classic" | "veggie" | "child";
};

export type MenuCategory = {
  id: string;
  key: MenuCategoryKey;
  enabled: boolean;
  position: number;
  items: MenuItem[];
};

export type GuestMedia = {
  id: string;
  kind: "photo" | "video";
  url: string;
  thumbUrl: string;
  uploaderName?: string;
  uploadedAt: string;
  /** Hidden from guests, still visible to the couple. */
  hidden: boolean;
};

export type DayOfSettings = {
  enabled: boolean;
  /** Drives the permanent QR URL. Never regenerated. */
  qrSlug: string;
  /** Whether guests may browse what has been shared. */
  galleryVisibleToGuests: boolean;
  /** ISO date; guests may upload until then. Independent of the flag above. */
  uploadsOpenUntil: string;
  afterWeddingMode: boolean;
  venuePlanUrl?: string;
};

/** Everything the day-of screens need, from one source. */
export type DayOfData = {
  settings: DayOfSettings;
  guests: DayOfGuest[];
  tables: DayOfTable[];
  menu: MenuCategory[];
  media: GuestMedia[];
};
```

- [ ] **Step 2: Écrire le mock**

Créer `shared/data/jour-j-mock.ts`. Les volumes suivent le cahier des charges :
140 invités, 124 confirmés, 4 en attente (donc 12 déclinés), 116 placés, 286
photos. Les tables portent les noms du cahier.

```ts
/**
 * Fictional day-of data, used to validate the UX before any table exists in
 * Supabase. Deleted in step 2 — nothing but the import path changes.
 *
 * Volumes match the brief: 140 guests, 124 confirmed, 4 pending, 116 seated,
 * 286 media.
 */

import type {
  DayOfData,
  DayOfGuest,
  DayOfTable,
  GuestMedia,
  MenuCategory,
} from "../types/jour-j";

const FIRST_NAMES = [
  "Marie", "Jordy", "Émilie", "Lucas", "Chloé", "Antoine", "Sarah", "Thomas",
  "Camille", "Hugo", "Léa", "Maxime", "Julie", "Nicolas", "Manon", "Alexandre",
  "Clara", "Julien", "Inès", "Romain",
];

const LAST_NAMES = [
  "Dupont", "Moreau", "Lefèvre", "Bernard", "Rossi", "Girard", "Fontaine",
  "Mercier", "Blanc", "Roux", "Caron", "Perrin",
];

/** Deterministic pseudo-random, so the mock is identical on every render. */
function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length];
}

function buildGuests(): DayOfGuest[] {
  return Array.from({ length: 140 }, (_, i) => {
    // 124 confirmed, 4 pending, 12 declined — in that order.
    const status: DayOfGuest["status"] =
      i < 124 ? "confirmed" : i < 128 ? "pending" : "declined";
    return {
      id: `g-${i + 1}`,
      firstName: pick(FIRST_NAMES, i * 7 + 1),
      lastName: pick(LAST_NAMES, i * 3 + 2),
      isChild: i % 12 === 0,
      status,
      dietary:
        i % 9 === 0 ? "Végétarien" : i % 14 === 0 ? "Sans gluten" : undefined,
    };
  });
}

const TABLE_NAMES = [
  "Capri", "Amalfi", "Portofino", "Positano", "Ravello",
  "Sorrente", "Ischia", "Procida", "Anacapri", "Maiori",
];

function buildTables(guests: DayOfGuest[]): DayOfTable[] {
  // Seat the first 116 confirmed guests across 10 tables of 12.
  const seatable = guests.filter((g) => g.status === "confirmed").slice(0, 116);

  return TABLE_NAMES.map((name, i) => ({
    id: `t-${i + 1}`,
    name,
    seatsLabel: `Table ${i + 1}`,
    shape: i === 0 ? ("long" as const) : ("round" as const),
    capacity: 12,
    x: 120 + (i % 4) * 260,
    y: 120 + Math.floor(i / 4) * 240,
    position: i,
    guestIds: seatable.slice(i * 12, (i + 1) * 12).map((g) => g.id),
  }));
}

function buildMenu(): MenuCategory[] {
  return [
    {
      id: "mc-1", key: "cocktail", enabled: true, position: 0,
      items: [
        { id: "mi-1", name: "Arancini à la truffe" },
        { id: "mi-2", name: "Burrata, tomates confites, basilic" },
        { id: "mi-3", name: "Spritz maison", description: "Aperol ou sans alcool" },
      ],
    },
    {
      id: "mc-2", key: "starter", enabled: true, position: 1,
      items: [
        { id: "mi-4", name: "Vitello tonnato", variant: "classic" },
        { id: "mi-5", name: "Velouté de courge, huile de noisette", variant: "veggie" },
      ],
    },
    {
      id: "mc-3", key: "main", enabled: true, position: 2,
      items: [
        { id: "mi-6", name: "Filet de bœuf, jus corsé", variant: "classic" },
        { id: "mi-7", name: "Risotto aux champignons", variant: "veggie" },
        { id: "mi-8", name: "Coquillettes au jambon", variant: "child" },
      ],
    },
    {
      id: "mc-4", key: "cheese", enabled: true, position: 3,
      items: [{ id: "mi-9", name: "Plateau de fromages affinés" }],
    },
    {
      id: "mc-5", key: "dessert", enabled: true, position: 4,
      items: [
        { id: "mi-10", name: "Pièce montée" },
        { id: "mi-11", name: "Tiramisu revisité" },
      ],
    },
    {
      id: "mc-6", key: "drinks", enabled: false, position: 5,
      items: [{ id: "mi-12", name: "Vins de la propriété" }],
    },
  ];
}

function buildMedia(): GuestMedia[] {
  return Array.from({ length: 286 }, (_, i) => {
    const kind: GuestMedia["kind"] = i % 11 === 0 ? "video" : "photo";
    // Placeholder assets; step 2 replaces these with Supabase storage URLs.
    const url = `https://picsum.photos/seed/jourj-${i}/1200/1600`;
    return {
      id: `m-${i + 1}`,
      kind,
      url,
      thumbUrl: `https://picsum.photos/seed/jourj-${i}/400/400`,
      uploaderName:
        i % 3 === 0 ? undefined : `${pick(FIRST_NAMES, i * 5)} ${pick(LAST_NAMES, i)}`,
      uploadedAt: new Date(2026, 5, 20, 18, (i * 7) % 60).toISOString(),
      hidden: i % 37 === 0,
    };
  });
}

const guests = buildGuests();

export const JOUR_J_MOCK: DayOfData = {
  settings: {
    enabled: true,
    qrSlug: "emilie-jordy",
    galleryVisibleToGuests: true,
    uploadsOpenUntil: "2026-06-27T23:59:00.000Z",
    afterWeddingMode: false,
  },
  guests,
  tables: buildTables(guests),
  menu: buildMenu(),
  media: buildMedia(),
};
```

- [ ] **Step 3: Vérifier que les volumes correspondent au cahier**

Run:
```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npx tsx -e "
import { JOUR_J_MOCK as m } from './shared/data/jour-j-mock';
const seated = new Set(m.tables.flatMap(t => t.guestIds));
console.log('guests', m.guests.length);
console.log('confirmed', m.guests.filter(g => g.status === 'confirmed').length);
console.log('pending', m.guests.filter(g => g.status === 'pending').length);
console.log('seated', seated.size);
console.log('media', m.media.length);
"
```
Expected: `guests 140`, `confirmed 124`, `pending 4`, `seated 116`, `media 286`.

- [ ] **Step 4: Commit**

```bash
git add shared/types/jour-j.ts shared/data/jour-j-mock.ts
git commit -m "feat(jour-j): shared day-of types and mock dataset"
```

---

## Task 2: Logique de placement (fonctions pures + tests)

Le canvas actuel dérive l'état de deux endroits à la fois (`tables[].guests`
*et* `guests[].table_id`), ce qui est la cause du bug d'affichage. Ici la
logique est extraite, testée, et n'a **qu'une** source de vérité :
`DayOfTable.guestIds`.

**Files:**
- Create: `shared/lib/seating.ts`
- Test: `shared/lib/seating.test.mjs`

**Interfaces:**
- Consumes: `DayOfGuest`, `DayOfTable` de `shared/types/jour-j.ts` (Task 1).
- Produces: `seatingSummary(tables, guests) → SeatingSummary`,
  `assignGuest(tables, guestId, tableId) → DayOfTable[]`,
  `unassignGuest(tables, guestId) → DayOfTable[]`,
  `unseatedGuests(tables, guests) → DayOfGuest[]`,
  `tableOfGuest(tables, guestId) → DayOfTable | undefined`,
  `searchSeatedGuests(tables, guests, query) → GuestTableMatch[]`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `shared/lib/seating.test.mjs` :

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  assignGuest,
  searchSeatedGuests,
  seatingSummary,
  tableOfGuest,
  unassignGuest,
  unseatedGuests,
} from "./seating.ts";

const guests = [
  { id: "g1", firstName: "Marie", lastName: "Dupont", isChild: false, status: "confirmed" },
  { id: "g2", firstName: "Jordy", lastName: "Moreau", isChild: false, status: "confirmed" },
  { id: "g3", firstName: "Léa", lastName: "Blanc", isChild: true, status: "confirmed" },
  { id: "g4", firstName: "Hugo", lastName: "Roux", isChild: false, status: "pending" },
  { id: "g5", firstName: "Marion", lastName: "Caron", isChild: false, status: "declined" },
];

const tables = [
  { id: "t1", name: "Capri", shape: "round", capacity: 2, x: 0, y: 0, position: 0, guestIds: ["g1"] },
  { id: "t2", name: "Amalfi", shape: "round", capacity: 4, x: 0, y: 0, position: 1, guestIds: [] },
];

test("summary counts seated, unseated and capacity", () => {
  const s = seatingSummary(tables, guests);
  assert.equal(s.seated, 1);
  // Only confirmed guests are seatable: g4 pending and g5 declined don't count.
  assert.equal(s.seatable, 3);
  assert.equal(s.unseated, 2);
  assert.equal(s.totalCapacity, 6);
});

test("assigning a guest puts them on the table", () => {
  const next = assignGuest(tables, "g2", "t1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1", "g2"]);
});

test("a guest can only sit at one table", () => {
  const next = assignGuest(assignGuest(tables, "g2", "t1"), "g2", "t2");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1"]);
  assert.deepEqual(next.find((t) => t.id === "t2").guestIds, ["g2"]);
});

test("capacity is never exceeded", () => {
  const full = assignGuest(tables, "g2", "t1"); // t1 capacity is 2, now full
  const next = assignGuest(full, "g3", "t1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1", "g2"]);
});

test("assigning a guest already at that table changes nothing", () => {
  const next = assignGuest(tables, "g1", "t1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, ["g1"]);
});

test("unassigning removes the guest from every table", () => {
  const next = unassignGuest(tables, "g1");
  assert.deepEqual(next.find((t) => t.id === "t1").guestIds, []);
});

test("unseated lists confirmed guests only", () => {
  const list = unseatedGuests(tables, guests).map((g) => g.id);
  assert.deepEqual(list, ["g2", "g3"]);
});

test("tableOfGuest finds the table, or undefined", () => {
  assert.equal(tableOfGuest(tables, "g1").name, "Capri");
  assert.equal(tableOfGuest(tables, "g2"), undefined);
});

test("search needs at least two characters", () => {
  assert.deepEqual(searchSeatedGuests(tables, guests, "m"), []);
});

test("search matches first or last name, case and accent insensitive", () => {
  const byFirst = searchSeatedGuests(tables, guests, "mar");
  assert.deepEqual(byFirst, [
    { firstName: "Marie", lastName: "Dupont", tableName: "Capri", seatsLabel: undefined },
  ]);
  assert.equal(searchSeatedGuests(tables, guests, "DUPONT").length, 1);
});

test("search never returns unseated or unconfirmed guests", () => {
  assert.deepEqual(searchSeatedGuests(tables, guests, "jordy"), []);
  assert.deepEqual(searchSeatedGuests(tables, guests, "marion"), []);
});

test("search caps at five results", () => {
  const many = Array.from({ length: 9 }, (_, i) => ({
    id: `x${i}`, firstName: "Alexandre", lastName: `Nom${i}`,
    isChild: false, status: "confirmed",
  }));
  const bigTable = [{
    id: "t9", name: "Grande", shape: "long", capacity: 20, x: 0, y: 0,
    position: 0, guestIds: many.map((g) => g.id),
  }];
  assert.equal(searchSeatedGuests(bigTable, many, "alex").length, 5);
});
```

- [ ] **Step 2: Lancer les tests, vérifier qu'ils échouent**

Run:
```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
node --experimental-strip-types --test shared/lib/seating.test.mjs
```
Expected: FAIL — `Cannot find module './seating.ts'`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `shared/lib/seating.ts` :

```ts
/**
 * Pure seating logic, kept out of the React components on purpose.
 *
 * There is exactly one source of truth for who sits where: `table.guestIds`.
 * The previous canvas kept that answer in two places at once and the two
 * drifted apart, which is why no table ever rendered its guests.
 */

import type { DayOfGuest, DayOfTable } from "../types/jour-j";

export type SeatingSummary = {
  /** Confirmed guests — the only ones that can be seated. */
  seatable: number;
  seated: number;
  unseated: number;
  totalCapacity: number;
};

export type GuestTableMatch = {
  firstName: string;
  lastName: string;
  tableName: string;
  seatsLabel?: string;
};

/** The guest-facing search never returns more than this many people. */
const MAX_SEARCH_RESULTS = 5;
/** Nor does it answer a query shorter than this — it is not a guest list. */
const MIN_QUERY_LENGTH = 2;

const isSeatable = (guest: DayOfGuest) => guest.status === "confirmed";

export function seatingSummary(
  tables: DayOfTable[],
  guests: DayOfGuest[],
): SeatingSummary {
  const seatedIds = new Set(tables.flatMap((t) => t.guestIds));
  const seatable = guests.filter(isSeatable);

  return {
    seatable: seatable.length,
    seated: seatable.filter((g) => seatedIds.has(g.id)).length,
    unseated: seatable.filter((g) => !seatedIds.has(g.id)).length,
    totalCapacity: tables.reduce((sum, t) => sum + t.capacity, 0),
  };
}

/**
 * Seats a guest, moving them off any other table first. A full table refuses
 * the guest rather than growing past its capacity.
 */
export function assignGuest(
  tables: DayOfTable[],
  guestId: string,
  tableId: string,
): DayOfTable[] {
  const target = tables.find((t) => t.id === tableId);
  if (!target) return tables;
  if (target.guestIds.includes(guestId)) return tables;
  if (target.guestIds.length >= target.capacity) return tables;

  return tables.map((table) => {
    if (table.id === tableId) {
      return { ...table, guestIds: [...table.guestIds, guestId] };
    }
    if (table.guestIds.includes(guestId)) {
      return { ...table, guestIds: table.guestIds.filter((id) => id !== guestId) };
    }
    return table;
  });
}

export function unassignGuest(
  tables: DayOfTable[],
  guestId: string,
): DayOfTable[] {
  return tables.map((table) =>
    table.guestIds.includes(guestId)
      ? { ...table, guestIds: table.guestIds.filter((id) => id !== guestId) }
      : table,
  );
}

export function unseatedGuests(
  tables: DayOfTable[],
  guests: DayOfGuest[],
): DayOfGuest[] {
  const seated = new Set(tables.flatMap((t) => t.guestIds));
  return guests.filter((g) => isSeatable(g) && !seated.has(g.id));
}

export function tableOfGuest(
  tables: DayOfTable[],
  guestId: string,
): DayOfTable | undefined {
  return tables.find((t) => t.guestIds.includes(guestId));
}

/** Lowercase and strip accents, so "Léa" matches "lea". */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * The lookup behind "Ma table" on the guest page.
 *
 * Deliberately narrow: it answers "which table am I at", never "who else is
 * invited". A short query returns nothing, results are capped, and the shape
 * carries no contact details — see §16 of the brief.
 */
export function searchSeatedGuests(
  tables: DayOfTable[],
  guests: DayOfGuest[],
  query: string,
): GuestTableMatch[] {
  const needle = normalise(query.trim());
  if (needle.length < MIN_QUERY_LENGTH) return [];

  const byId = new Map(guests.map((g) => [g.id, g]));
  const matches: GuestTableMatch[] = [];

  for (const table of tables) {
    for (const guestId of table.guestIds) {
      const guest = byId.get(guestId);
      if (!guest || !isSeatable(guest)) continue;

      const haystack = normalise(`${guest.firstName} ${guest.lastName}`);
      if (!haystack.includes(needle)) continue;

      matches.push({
        firstName: guest.firstName,
        lastName: guest.lastName,
        tableName: table.name,
        seatsLabel: table.seatsLabel,
      });
      if (matches.length === MAX_SEARCH_RESULTS) return matches;
    }
  }

  return matches;
}
```

- [ ] **Step 4: Lancer les tests, vérifier qu'ils passent**

Run:
```bash
node --experimental-strip-types --test shared/lib/seating.test.mjs
```
Expected: PASS — 12 tests.

Si `--experimental-strip-types` n'est pas supporté par la version de Node
installée (< 22.6), vérifier avec `node --version` et utiliser
`npx tsx --test shared/lib/seating.test.mjs` (`tsx` est déjà une devDependency
du dashboard).

- [ ] **Step 5: Ajouter le script de test**

Modifier `package.json` à la racine, dans `"scripts"` :

```json
"test": "node --experimental-strip-types --test shared/lib/*.test.mjs"
```

- [ ] **Step 6: Commit**

```bash
git add shared/lib/seating.ts shared/lib/seating.test.mjs package.json
git commit -m "feat(jour-j): pure seating logic with a single source of truth"
```

---

## Task 3: Navigation en six sections

**Files:**
- Create: `dashboard/src/components/navigation/nav-config.ts`
- Create: `dashboard/src/components/navigation/NavSection.tsx`
- Create: `dashboard/src/components/navigation/ComingSoon.tsx`
- Modify: `dashboard/src/components/dashboard/Sidebar.tsx`
- Modify: `dashboard/messages/{fr,en,de,es,pt,it,ar,zh,ja}.json`

**Interfaces:**
- Consumes: rien des tâches 1-2.
- Produces: `NAV_SECTIONS: NavSectionDef[]` et le composant
  `<ComingSoon titleKey="..." />`, utilisés par les tâches 4-8.

- [ ] **Step 1: Écrire la configuration de navigation**

Créer `dashboard/src/components/navigation/nav-config.ts` :

```ts
/**
 * The dashboard's six sections, per §23 of the brief.
 *
 * Two pages that already work — /guests and the seating plan — were reachable
 * from no link at all before this. Adding them here is most of the point.
 */

import {
  BarChart3,
  CalendarHeart,
  Home,
  PartyPopper,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemDef = {
  /** i18n key under `Sidebar.sections.<section>.items` */
  key: string;
  href: string;
  /** Renders a "coming soon" placeholder instead of a real page. */
  comingSoon?: boolean;
};

export type NavSectionDef = {
  /** i18n key under `Sidebar.sections` */
  key: string;
  icon: LucideIcon;
  /** A section with a single item links straight to it, with no accordion. */
  href?: string;
  items?: NavItemDef[];
};

export const NAV_SECTIONS: NavSectionDef[] = [
  { key: "home", icon: Home, href: "/" },
  {
    key: "guests",
    icon: Users,
    items: [
      { key: "all", href: "/guests" },
      { key: "rsvp", href: "/rsvp-responses" },
      { key: "groups", href: "/guests/groupes", comingSoon: true },
      { key: "meals", href: "/guests/repas", comingSoon: true },
    ],
  },
  {
    key: "invitation",
    icon: CalendarHeart,
    items: [
      { key: "modules", href: "/modules" },
      { key: "events", href: "/invitation/evenements", comingSoon: true },
      { key: "schedule", href: "/invitation/programme", comingSoon: true },
      { key: "venue", href: "/invitation/lieu", comingSoon: true },
      { key: "faq", href: "/invitation/faq", comingSoon: true },
      { key: "playlist", href: "/playlist" },
    ],
  },
  {
    key: "day_of",
    icon: PartyPopper,
    items: [
      { key: "seating", href: "/jour-j/plan-de-table" },
      { key: "qr_code", href: "/jour-j/qr-code" },
      { key: "menu", href: "/jour-j/menu" },
      { key: "photos", href: "/jour-j/photos" },
      { key: "settings", href: "/jour-j/parametres" },
    ],
  },
  { key: "stats", icon: BarChart3, href: "/stats" },
  {
    key: "settings",
    icon: Settings,
    items: [
      { key: "couple", href: "/settings" },
      { key: "billing", href: "/billing" },
      { key: "messages", href: "/messages" },
    ],
  },
];

/** True when `pathname` is inside the section — drives the open accordion. */
export function isSectionActive(
  section: NavSectionDef,
  pathname: string,
): boolean {
  if (section.href) return pathname === section.href;
  return (section.items ?? []).some((item) => pathname.startsWith(item.href));
}
```

- [ ] **Step 2: Écrire le composant de section**

Créer `dashboard/src/components/navigation/NavSection.tsx` :

```tsx
"use client";

import { Link } from "@/navigation";
import { cn } from "@shared/lib/utils";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isSectionActive, type NavSectionDef } from "./nav-config";

type Props = {
  section: NavSectionDef;
  pathname: string;
  onNavigate: () => void;
};

export function NavSection({ section, pathname, onNavigate }: Props) {
  const t = useTranslations("Sidebar.sections");
  const active = isSectionActive(section, pathname);
  // A section holding the current page starts open; the others stay folded.
  const [open, setOpen] = useState(active);

  const Icon = section.icon;
  const label = t(`${section.key}.label`);

  // Single-page sections are a plain link — no accordion to expand.
  if (section.href) {
    return (
      <Link
        href={section.href}
        onClick={onNavigate}
        className={cn(
          // min-h-11 keeps the tap target at 44px on touch screens.
          "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
          active
            ? "bg-white/15 font-medium text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon className='h-5 w-5 shrink-0' />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors",
          active ? "text-white" : "text-white/70 hover:text-white",
        )}
      >
        <Icon className='h-5 w-5 shrink-0' />
        <span className='flex-1 text-left'>{label}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul className='mt-1 space-y-0.5 border-l border-white/15 pl-4 ml-5'>
          {(section.items ?? []).map((item) => {
            const itemActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex min-h-11 items-center rounded-lg px-3 text-sm transition-colors",
                    itemActive
                      ? "bg-white/15 font-medium text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {t(`${section.key}.items.${item.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Écrire le placeholder**

Créer `dashboard/src/components/navigation/ComingSoon.tsx` :

```tsx
import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * Stands in for a page the brief specifies but that isn't built yet, so the
 * couple can walk the whole architecture without us faking its content.
 */
export async function ComingSoon({ titleKey }: { titleKey: string }) {
  const t = await getTranslations("ComingSoon");
  const tNav = await getTranslations("Sidebar.sections");

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-studio-lavande/40 bg-white p-8 text-center shadow-studio-card md:mt-16'>
        <div className='mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-studio-jaune/40'>
          <Sparkles className='h-6 w-6 text-studio-violet' />
        </div>
        <h1 className='font-heading text-h3 text-studio-violet'>
          {tNav(titleKey)}
        </h1>
        <p className='mt-3 text-sm text-studio-violet/70'>{t("body")}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Brancher la sidebar**

Dans `dashboard/src/components/dashboard/Sidebar.tsx`, remplacer la constante
`navItems` et la boucle qui la rend. Supprimer le tableau `navItems` (lignes
33-41) ainsi que les imports d'icônes devenus inutiles (`CreditCard`, `Home`,
`Mail`, `MessageSquare`, `Music2`, `Puzzle`, `Send`, `Settings`), en gardant
`LogOut`, `Menu` et `X`. Ajouter :

```tsx
import { NAV_SECTIONS } from "@/components/navigation/nav-config";
import { NavSection } from "@/components/navigation/NavSection";
```

Puis, dans le `<nav>`, rendre :

```tsx
<nav className='flex-1 space-y-1 overflow-y-auto'>
  {NAV_SECTIONS.map((section) => (
    <NavSection
      key={section.key}
      section={section}
      pathname={pathname}
      onNavigate={handleLinkClick}
    />
  ))}
</nav>
```

- [ ] **Step 5: Rediriger l'ancienne route du plan de table**

Créer `dashboard/src/app/[locale]/seating-plan/page.tsx` (remplace le contenu
existant — la page est réécrite en Task 4) :

```tsx
import { redirect } from "@/navigation";

/** The seating plan moved under the day-of section. Old links keep working. */
export default async function SeatingPlanRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/jour-j/plan-de-table", locale });
}
```

- [ ] **Step 6: Traduire les neuf locales**

Dans chaque `dashboard/messages/<locale>.json`, remplacer les clés plates de
`Sidebar` (`home`, `guests`, `rsvp_responses`, `playlist`, `messages`,
`seating_plan`, `billing`, `settings`, `config_section`, `modules`) par
l'arborescence ci-dessous, **en gardant** `view_site`, `logout` et
`logout_confirmation` inchangés. Ajouter aussi le bloc `ComingSoon`.

Pour `fr.json` :

```json
"Sidebar": {
  "sections": {
    "home": { "label": "Accueil" },
    "guests": {
      "label": "Invités",
      "items": {
        "all": "Tous les invités",
        "rsvp": "Réponses RSVP",
        "groups": "Groupes",
        "meals": "Repas"
      }
    },
    "invitation": {
      "label": "Invitation",
      "items": {
        "modules": "Mes modules",
        "events": "Événements",
        "schedule": "Programme",
        "venue": "Lieu & infos pratiques",
        "faq": "FAQ",
        "playlist": "Playlist"
      }
    },
    "day_of": {
      "label": "Jour J",
      "items": {
        "seating": "Plan de table",
        "qr_code": "QR Code",
        "menu": "Menu",
        "photos": "Photos & vidéos",
        "settings": "Paramètres"
      }
    },
    "stats": { "label": "Statistiques" },
    "settings": {
      "label": "Paramètres",
      "items": {
        "couple": "Couple",
        "billing": "Facturation",
        "messages": "Messages"
      }
    }
  },
  "view_site": "…conserver la valeur existante…",
  "logout": "…conserver…",
  "logout_confirmation": { "…conserver le bloc entier…" }
},
"ComingSoon": {
  "body": "Cette section arrive bientôt. Elle fait partie du parcours prévu et sera activée dans une prochaine mise à jour."
}
```

Traduire les mêmes clés dans `en de es pt it ar zh ja`. Repères pour l'anglais :
Home · Guests (All guests / RSVP replies / Groups / Meals) · Invitation (My
modules / Events / Schedule / Venue & practical info / FAQ / Playlist) · Day of
(Seating plan / QR code / Menu / Photos & videos / Settings) · Statistics ·
Settings (Couple / Billing / Messages). `ComingSoon.body` : "This section is on
its way. It's part of the planned journey and will be switched on in a coming
update."

- [ ] **Step 7: Vérifier que les neuf locales ont les mêmes clés**

Run:
```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie/dashboard
python3 - <<'PY'
import json, glob, sys
def flat(d, p=""):
    out = set()
    for k, v in d.items():
        key = f"{p}.{k}" if p else k
        out |= flat(v, key) if isinstance(v, dict) else {key}
    return out
ref = None
for path in sorted(glob.glob("messages/*.json")):
    keys = {k for k in flat(json.load(open(path))) if k.startswith(("Sidebar", "ComingSoon"))}
    if ref is None:
        ref, refp = keys, path
        continue
    if keys != ref:
        print(f"MISMATCH {path}: missing={sorted(ref-keys)} extra={sorted(keys-ref)}")
        sys.exit(1)
print(f"OK — {len(ref)} keys identical across 9 locales")
PY
```
Expected: `OK — <n> keys identical across 9 locales`.

- [ ] **Step 8: Lancer le lint et le build**

Run:
```bash
cd dashboard && npm run lint && npm run build
```
Expected: aucune erreur. Une erreur `MISSING_MESSAGE` au build signale une clé
oubliée à l'étape 6.

- [ ] **Step 9: Vérifier le rendu mobile**

Run `npm run dev:dashboard` depuis la racine, ouvrir `http://localhost:3003/fr`
en 375 px de large. Vérifier : le tiroir s'ouvre, les six sections sont là, la
section contenant la page courante est dépliée, chaque lien fait ≥ 44 px de
haut, aucun scroll horizontal.

- [ ] **Step 10: Commit**

```bash
git add dashboard/src/components/navigation dashboard/src/components/dashboard/Sidebar.tsx \
        dashboard/src/app/\[locale\]/seating-plan/page.tsx dashboard/messages
git commit -m "feat(dashboard): six-section navigation per the brief

Also reconnects /guests and the seating plan, which shipped behind no
link at all."
```

---

## Task 4: Plan de table — desktop

**Files:**
- Create: `dashboard/src/app/[locale]/jour-j/plan-de-table/page.tsx`
- Create: `dashboard/src/components/jour-j/seating/SeatingScreen.tsx`
- Create: `dashboard/src/components/jour-j/seating/SeatingHeader.tsx`
- Create: `dashboard/src/components/jour-j/seating/SeatingBoard.tsx`
- Create: `dashboard/src/components/jour-j/seating/TableCard.tsx`
- Create: `dashboard/src/components/jour-j/seating/UnseatedPanel.tsx`
- Modify: `dashboard/messages/{fr,en,de,es,pt,it,ar,zh,ja}.json`

**Interfaces:**
- Consumes: `JOUR_J_MOCK` (Task 1); `seatingSummary`, `assignGuest`,
  `unassignGuest`, `unseatedGuests` (Task 2).
- Produces: `<SeatingScreen tables guests />` — le composant client qui porte
  l'état du placement. Task 5 y branche la vue mobile.

- [ ] **Step 1: Écrire la page (server component)**

```tsx
import { SeatingScreen } from "@/components/jour-j/seating/SeatingScreen";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function SeatingPlanPage() {
  // Mock data for now — step 2 of the spec swaps this for a Supabase read and
  // nothing below changes.
  const { tables, guests } = JOUR_J_MOCK;
  return <SeatingScreen initialTables={tables} guests={guests} />;
}
```

- [ ] **Step 2: Écrire le conteneur d'état**

`SeatingScreen.tsx` porte l'unique état et choisit la vue selon la largeur. Le
choix se fait en CSS (`hidden md:flex` / `md:hidden`), pas en JS : les deux
vues sont montées, aucune ne dépend d'une mesure au premier rendu.

```tsx
"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import {
  assignGuest,
  seatingSummary,
  unassignGuest,
  unseatedGuests,
} from "@shared/lib/seating";
import { useMemo, useState } from "react";
import { SeatingBoard } from "./SeatingBoard";
import { SeatingHeader } from "./SeatingHeader";
import { SeatingList } from "./SeatingList";

type Props = { initialTables: DayOfTable[]; guests: DayOfGuest[] };

export function SeatingScreen({ initialTables, guests }: Props) {
  const [tables, setTables] = useState(initialTables);
  const [query, setQuery] = useState("");

  const summary = useMemo(() => seatingSummary(tables, guests), [tables, guests]);
  const unseated = useMemo(() => unseatedGuests(tables, guests), [tables, guests]);
  const guestsById = useMemo(
    () => new Map(guests.map((g) => [g.id, g])),
    [guests],
  );

  const filteredUnseated = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return unseated;
    return unseated.filter((g) =>
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(needle),
    );
  }, [unseated, query]);

  const onAssign = (guestId: string, tableId: string) =>
    setTables((prev) => assignGuest(prev, guestId, tableId));

  const onUnassign = (guestId: string) =>
    setTables((prev) => unassignGuest(prev, guestId));

  const onMoveTable = (tableId: string, x: number, y: number) =>
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, x, y } : t)),
    );

  return (
    <div className='flex min-h-screen flex-col bg-studio-creme'>
      <SeatingHeader summary={summary} query={query} onQueryChange={setQuery} />

      {/* Desktop: drag & drop board. */}
      <div className='hidden flex-1 md:flex'>
        <SeatingBoard
          tables={tables}
          guestsById={guestsById}
          unseated={filteredUnseated}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onMoveTable={onMoveTable}
        />
      </div>

      {/* Mobile: tap-to-assign list — dragging is unusable at 375px. */}
      <div className='flex-1 md:hidden'>
        <SeatingList
          tables={tables}
          guestsById={guestsById}
          unseated={filteredUnseated}
          onAssign={onAssign}
          onUnassign={onUnassign}
        />
      </div>
    </div>
  );
}
```

`SeatingList` est écrit en Task 5. Pour que cette tâche compile et se vérifie
seule, créer d'abord `SeatingList.tsx` avec la **signature définitive** — celle
que Task 5 remplira. Les props doivent être typées dès maintenant, sinon
l'appel ci-dessus ne compile pas.

```tsx
"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";

export type SeatingListProps = {
  tables: DayOfTable[];
  guestsById: Map<string, DayOfGuest>;
  unseated: DayOfGuest[];
  onAssign: (guestId: string, tableId: string) => void;
  onUnassign: (guestId: string) => void;
};

/** Replaced wholesale in Task 5 — the desktop board is what this task proves. */
export function SeatingList(_props: SeatingListProps) {
  return null;
}
```

- [ ] **Step 3: Écrire l'en-tête**

`SeatingHeader.tsx` — les compteurs du §13.1 et la recherche. Empile en colonne
sur mobile.

```tsx
"use client";

import type { SeatingSummary } from "@shared/lib/seating";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  summary: SeatingSummary;
  query: string;
  onQueryChange: (value: string) => void;
};

export function SeatingHeader({ summary, query, onQueryChange }: Props) {
  const t = useTranslations("Seating");

  return (
    <header className='sticky top-0 z-10 border-b border-studio-lavande/30 bg-white/95 px-4 py-4 backdrop-blur md:px-8'>
      <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>

      <div className='mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <dl className='flex flex-wrap gap-x-5 gap-y-1 text-sm'>
          <div className='flex gap-1.5'>
            <dt className='text-studio-violet/60'>{t("seated")}</dt>
            <dd className='font-medium text-studio-violet'>{summary.seated}</dd>
          </div>
          <div className='flex gap-1.5'>
            <dt className='text-studio-violet/60'>{t("remaining")}</dt>
            <dd className='font-medium text-studio-violet'>{summary.unseated}</dd>
          </div>
          <div className='flex gap-1.5'>
            <dt className='text-studio-violet/60'>{t("capacity")}</dt>
            <dd className='font-medium text-studio-violet'>
              {summary.totalCapacity}
            </dd>
          </div>
        </dl>

        <label className='relative md:w-72'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-violet/40' />
          <input
            type='search'
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("search_placeholder")}
            className='min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white pl-9 pr-3 text-sm text-studio-violet placeholder:text-studio-violet/40 focus:border-studio-violet focus:outline-none'
          />
        </label>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Écrire le panneau des non-placés**

`UnseatedPanel.tsx` — chaque invité est `useDraggable`.

```tsx
"use client";

import type { DayOfGuest } from "@shared/types/jour-j";
import { useDraggable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

export function UnseatedPanel({ guests }: { guests: DayOfGuest[] }) {
  const t = useTranslations("Seating");

  return (
    <aside className='w-72 shrink-0 overflow-y-auto border-r border-studio-lavande/30 bg-white p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-sm font-medium text-studio-violet'>
          {t("unseated_title")}
        </h2>
        <span className='rounded-full bg-studio-beige px-2 py-0.5 text-xs text-studio-violet'>
          {guests.length}
        </span>
      </div>

      {guests.length === 0 ? (
        <p className='py-8 text-center text-sm text-studio-violet/50'>
          {t("all_seated")}
        </p>
      ) : (
        <ul className='space-y-1.5'>
          {guests.map((guest) => (
            <DraggableGuest key={guest.id} guest={guest} />
          ))}
        </ul>
      )}
    </aside>
  );
}

function DraggableGuest({ guest }: { guest: DayOfGuest }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { type: "guest", guestId: guest.id },
  });

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg border border-studio-lavande/40 bg-white px-3 py-2 text-sm text-studio-violet active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {guest.firstName} {guest.lastName}
    </li>
  );
}
```

- [ ] **Step 5: Écrire la carte de table**

`TableCard.tsx` — **reçoit ses invités**, contrairement au composant qu'elle
remplace.

```tsx
"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@shared/lib/utils";
import { X } from "lucide-react";

type Props = {
  table: DayOfTable;
  /** Resolved from the table's own guestIds — the single source of truth. */
  seated: DayOfGuest[];
  onUnassign: (guestId: string) => void;
};

export function TableCard({ table, seated, onUnassign }: Props) {
  const { attributes, listeners, setNodeRef: dragRef, transform } =
    useDraggable({ id: `table-${table.id}`, data: { type: "table", tableId: table.id } });

  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: `drop-${table.id}`,
    data: { type: "table-drop", tableId: table.id },
  });

  const isFull = seated.length >= table.capacity;

  return (
    <div
      ref={dragRef}
      style={{
        transform: CSS.Translate.toString(transform),
        left: table.x,
        top: table.y,
      }}
      className='absolute w-52'
    >
      <div
        ref={dropRef}
        className={cn(
          "rounded-2xl border-2 bg-white p-3 shadow-studio-card transition-colors",
          isOver && !isFull && "border-studio-violet bg-studio-jaune/20",
          isOver && isFull && "border-red-400 bg-red-50",
          !isOver && "border-studio-lavande/50",
        )}
      >
        <div
          {...listeners}
          {...attributes}
          className='mb-2 cursor-grab active:cursor-grabbing'
        >
          <p className='font-heading text-sm text-studio-violet'>{table.name}</p>
          <p className='text-xs text-studio-violet/60'>
            {/* "Table Capri — 8/10", per §13.1 */}
            {seated.length}/{table.capacity}
            {table.seatsLabel ? ` · ${table.seatsLabel}` : ""}
          </p>
        </div>

        <ul className='space-y-0.5'>
          {seated.map((guest) => (
            <li
              key={guest.id}
              className='group flex items-center justify-between rounded px-1.5 py-1 text-xs text-studio-violet hover:bg-studio-creme'
            >
              <span className='truncate'>
                {guest.firstName} {guest.lastName}
              </span>
              <button
                type='button'
                onClick={() => onUnassign(guest.id)}
                className='ml-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                aria-label={`Retirer ${guest.firstName} ${guest.lastName}`}
              >
                <X className='h-3.5 w-3.5 text-studio-violet/50 hover:text-red-500' />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Écrire le canevas**

`SeatingBoard.tsx` — le `DndContext`. Chaque `TableCard` reçoit ses invités
résolus depuis `guestsById`.

```tsx
"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import {
  DndContext,
  MouseSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { TableCard } from "./TableCard";
import { UnseatedPanel } from "./UnseatedPanel";

type Props = {
  tables: DayOfTable[];
  guestsById: Map<string, DayOfGuest>;
  unseated: DayOfGuest[];
  onAssign: (guestId: string, tableId: string) => void;
  onUnassign: (guestId: string) => void;
  onMoveTable: (tableId: string, x: number, y: number) => void;
};

export function SeatingBoard({
  tables,
  guestsById,
  unseated,
  onAssign,
  onUnassign,
  onMoveTable,
}: Props) {
  // 8px of travel before a drag starts, so a click to remove still registers.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragEnd = ({ active, over, delta }: DragEndEvent) => {
    const data = active.data.current;
    if (!data) return;

    if (data.type === "table") {
      const table = tables.find((t) => t.id === data.tableId);
      if (table) onMoveTable(table.id, table.x + delta.x, table.y + delta.y);
      return;
    }

    if (data.type === "guest" && over?.data.current?.type === "table-drop") {
      onAssign(data.guestId as string, over.data.current.tableId as string);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <div className='flex flex-1 overflow-hidden'>
        <UnseatedPanel guests={unseated} />

        <div className='relative flex-1 overflow-auto bg-studio-creme'>
          <div className='relative min-h-[1200px] min-w-[1400px]'>
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                seated={table.guestIds
                  .map((id) => guestsById.get(id))
                  .filter((g): g is DayOfGuest => Boolean(g))}
                onUnassign={onUnassign}
              />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
```

- [ ] **Step 7: Traduire les neuf locales**

Ajouter le bloc `Seating` à chaque `dashboard/messages/<locale>.json`. Pour `fr` :

```json
"Seating": {
  "title": "Plan de table",
  "seated": "Placés",
  "remaining": "À placer",
  "capacity": "Capacité",
  "search_placeholder": "Rechercher un invité…",
  "unseated_title": "Invités à placer",
  "all_seated": "Tous les invités sont placés",
  "assign": "Placer des invités",
  "assign_title": "Placer à la table {table}",
  "seats_left": "{count} place(s) restante(s)",
  "table_full": "Table complète",
  "move_to": "Déplacer vers…",
  "remove": "Retirer",
  "done": "Terminé",
  "no_tables": "Aucune table pour l'instant"
}
```

Anglais : Seating plan · Seated · To seat · Capacity · Search a guest… · Guests
to seat · Everyone is seated · Seat guests · Seat at {table} · {count} seat(s)
left · Table full · Move to… · Remove · Done · No tables yet. Traduire de même
dans `de es pt it ar zh ja`.

- [ ] **Step 8: Vérifier le build**

Run:
```bash
cd dashboard && npm run lint && npm run build
```
Expected: aucune erreur.

- [ ] **Step 9: Vérifier dans le navigateur**

`npm run dev:dashboard`, ouvrir `http://localhost:3003/fr/jour-j/plan-de-table`
en ≥ 1024 px. Vérifier : dix tables portant chacune ses convives et un compteur
`12/12` — c'est précisément ce que l'ancien écran ne faisait pas; glisser un
invité du panneau vers une table l'y ajoute; une table pleine refuse le dépôt
(bordure rouge); le survol d'un convive révèle la croix qui le retire; les
compteurs de l'en-tête suivent.

- [ ] **Step 10: Commit**

```bash
git add dashboard/src/app/\[locale\]/jour-j dashboard/src/components/jour-j dashboard/messages
git commit -m "feat(jour-j): desktop seating board on mock data

Each table renders the guests it actually holds, derived from one source
instead of two states that drifted apart."
```

---

## Task 5: Plan de table — mobile

Le drag & drop tactile est abandonné, pas dégradé : sur 375 px, une liste en
accordéon et une feuille de sélection multiple.

**Files:**
- Create: `dashboard/src/components/jour-j/seating/AssignGuestsSheet.tsx`
- Modify: `dashboard/src/components/jour-j/seating/SeatingList.tsx` (remplace
  le fichier minimal de Task 4)

**Interfaces:**
- Consumes: `assignGuest`/`unassignGuest` via les callbacks de `SeatingScreen`
  (Task 4); clés i18n `Seating.*` (Task 4, Step 7).
- Produces: `<SeatingList tables guestsById unseated onAssign onUnassign />`.

- [ ] **Step 1: Écrire la feuille de sélection**

```tsx
"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  table: DayOfTable;
  candidates: DayOfGuest[];
  seatsLeft: number;
  onConfirm: (guestIds: string[]) => void;
  onClose: () => void;
};

/**
 * Full-screen sheet for seating several guests at once with the thumb.
 * Selection is capped at the table's remaining seats.
 */
export function AssignGuestsSheet({
  table,
  candidates,
  seatsLeft,
  onConfirm,
  onClose,
}: Props) {
  const t = useTranslations("Seating");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const visible = candidates.filter((g) =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < seatsLeft
          ? [...prev, id]
          : prev,
    );

  return (
    <div className='fixed inset-0 z-50 flex flex-col bg-white'>
      <header className='border-b border-studio-lavande/30 px-4 py-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-heading text-base text-studio-violet'>
            {t("assign_title", { table: table.name })}
          </h2>
          <button
            type='button'
            onClick={onClose}
            aria-label={t("done")}
            className='flex h-11 w-11 items-center justify-center'
          >
            <X className='h-5 w-5 text-studio-violet' />
          </button>
        </div>
        <p className='text-xs text-studio-violet/60'>
          {t("seats_left", { count: seatsLeft - selected.length })}
        </p>
        <input
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          className='mt-2 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
        />
      </header>

      <ul className='flex-1 overflow-y-auto p-2'>
        {visible.map((guest) => {
          const isSelected = selected.includes(guest.id);
          const blocked = !isSelected && selected.length >= seatsLeft;
          return (
            <li key={guest.id}>
              <button
                type='button'
                disabled={blocked}
                onClick={() => toggle(guest.id)}
                className={`flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${
                  isSelected ? "bg-studio-jaune/30" : ""
                } ${blocked ? "opacity-40" : ""}`}
              >
                <span className='text-studio-violet'>
                  {guest.firstName} {guest.lastName}
                </span>
                {isSelected && <Check className='h-4 w-4 text-studio-violet' />}
              </button>
            </li>
          );
        })}
      </ul>

      <footer className='border-t border-studio-lavande/30 p-4'>
        <button
          type='button'
          disabled={selected.length === 0}
          onClick={() => {
            onConfirm(selected);
            onClose();
          }}
          className='min-h-12 w-full rounded-lg bg-studio-violet text-sm font-medium text-white disabled:opacity-40'
        >
          {t("done")} ({selected.length})
        </button>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Écrire la liste mobile**

Remplacer entièrement `SeatingList.tsx` :

```tsx
"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import { ChevronDown, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssignGuestsSheet } from "./AssignGuestsSheet";

type Props = {
  tables: DayOfTable[];
  guestsById: Map<string, DayOfGuest>;
  unseated: DayOfGuest[];
  onAssign: (guestId: string, tableId: string) => void;
  onUnassign: (guestId: string) => void;
};

/**
 * The mobile seating view. Dragging a guest onto a table with a thumb on a
 * 375px screen doesn't work, so this is tap-to-assign instead — same data,
 * same operations, a different gesture.
 */
export function SeatingList({
  tables,
  guestsById,
  unseated,
  onAssign,
  onUnassign,
}: Props) {
  const t = useTranslations("Seating");
  const [openId, setOpenId] = useState<string | null>(null);
  // Hold the id, not the object: a captured table goes stale the moment
  // someone is seated at it, and the sheet would show the wrong seat count.
  const [sheetTableId, setSheetTableId] = useState<string | null>(null);
  const sheetTable = tables.find((t) => t.id === sheetTableId) ?? null;

  if (tables.length === 0) {
    return (
      <p className='p-8 text-center text-sm text-studio-violet/60'>
        {t("no_tables")}
      </p>
    );
  }

  return (
    <>
      <div className='space-y-2 p-4'>
        {[...tables]
          .sort((a, b) => a.position - b.position)
          .map((table) => {
            const seated = table.guestIds
              .map((id) => guestsById.get(id))
              .filter((g): g is DayOfGuest => Boolean(g));
            const seatsLeft = table.capacity - seated.length;
            const isOpen = openId === table.id;

            return (
              <section
                key={table.id}
                className='overflow-hidden rounded-xl border border-studio-lavande/40 bg-white'
              >
                <button
                  type='button'
                  onClick={() => setOpenId(isOpen ? null : table.id)}
                  aria-expanded={isOpen}
                  className='flex min-h-14 w-full items-center justify-between px-4 text-left'
                >
                  <span>
                    <span className='block font-heading text-sm text-studio-violet'>
                      {table.name}
                    </span>
                    <span className='block text-xs text-studio-violet/60'>
                      {seated.length}/{table.capacity}
                      {table.seatsLabel ? ` · ${table.seatsLabel}` : ""}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-studio-violet/50 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className='border-t border-studio-lavande/30 px-2 pb-2'>
                    <ul>
                      {seated.map((guest) => (
                        <li
                          key={guest.id}
                          className='flex min-h-12 items-center justify-between px-2 text-sm text-studio-violet'
                        >
                          <span className='truncate'>
                            {guest.firstName} {guest.lastName}
                          </span>
                          <button
                            type='button'
                            onClick={() => onUnassign(guest.id)}
                            aria-label={t("remove")}
                            className='flex h-11 w-11 shrink-0 items-center justify-center'
                          >
                            <X className='h-4 w-4 text-studio-violet/50' />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type='button'
                      disabled={seatsLeft === 0}
                      onClick={() => setSheetTableId(table.id)}
                      className='mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-studio-creme text-sm text-studio-violet disabled:opacity-40'
                    >
                      <UserPlus className='h-4 w-4' />
                      {seatsLeft === 0 ? t("table_full") : t("assign")}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
      </div>

      {sheetTable && (
        <AssignGuestsSheet
          table={sheetTable}
          candidates={unseated}
          seatsLeft={sheetTable.capacity - sheetTable.guestIds.length}
          onConfirm={(ids) => ids.forEach((id) => onAssign(id, sheetTable.id))}
          onClose={() => setSheetTableId(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Vérifier le build**

Run: `cd dashboard && npm run lint && npm run build`
Expected: aucune erreur.

- [ ] **Step 4: Vérifier à 375 px**

Ouvrir `http://localhost:3003/fr/jour-j/plan-de-table` en 375 px. Vérifier :
la liste en accordéon remplace le canevas; « Placer des invités » ouvre la
feuille; la sélection se bloque une fois les places épuisées et le compteur
descend à 0; valider place bien les invités; retirer fonctionne; aucun scroll
horizontal; toutes les cibles ≥ 44 px.

- [ ] **Step 5: Commit**

```bash
git add dashboard/src/components/jour-j/seating
git commit -m "feat(jour-j): tap-to-assign seating view for phones"
```

---

## Task 6: QR code

**Files:**
- Create: `dashboard/src/app/[locale]/jour-j/qr-code/page.tsx`
- Create: `dashboard/src/components/jour-j/qr/QrCodePanel.tsx`
- Modify: `dashboard/package.json` (dépendance `qrcode`)
- Modify: `dashboard/messages/*.json`

**Interfaces:**
- Consumes: `JOUR_J_MOCK.settings.qrSlug` (Task 1).
- Produces: rien pour les tâches suivantes.

- [ ] **Step 1: Installer `qrcode`**

Run:
```bash
cd /Users/tarik.klezo/Documents/perso/the-studio-digital-papeterie
npm install qrcode --workspace dashboard
npm install --save-dev @types/qrcode --workspace dashboard
```

- [ ] **Step 2: Écrire la page**

Le SVG est généré **côté serveur** : pas de `<canvas>`, donc rien à attendre du
navigateur, et l'export imprimable est disponible immédiatement.

```tsx
import { QrCodePanel } from "@/components/jour-j/qr/QrCodePanel";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import QRCode from "qrcode";

export default async function QrCodePage() {
  const { qrSlug } = JOUR_J_MOCK.settings;
  const url = `https://thestudio.fr/jourj/${qrSlug}`;

  // Rendered here rather than in the browser: the printable export must not
  // depend on a canvas being mounted.
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: { dark: "#4B3F72", light: "#FFFFFF" },
  });

  const pngDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 1024,
    color: { dark: "#4B3F72", light: "#FFFFFF" },
  });

  return <QrCodePanel url={url} svg={svg} pngDataUrl={pngDataUrl} />;
}
```

- [ ] **Step 3: Écrire le panneau**

```tsx
"use client";

import { Download, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

type Props = { url: string; svg: string; pngDataUrl: string };

export function QrCodePanel({ url, svg, pngDataUrl }: Props) {
  const t = useTranslations("QrCode");

  const download = (href: string, filename: string) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
  };

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const href = URL.createObjectURL(blob);
    download(href, "qr-code-jour-j.svg");
    URL.revokeObjectURL(href);
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("permanent_note")}</p>

        <div className='mt-6 rounded-2xl border border-studio-lavande/40 bg-white p-6 shadow-studio-card'>
          <div
            className='mx-auto w-full max-w-[260px] [&>svg]:h-auto [&>svg]:w-full'
            dangerouslySetInnerHTML={{ __html: svg }}
          />

          <div className='mt-5 flex items-center gap-2 rounded-lg bg-studio-creme px-3 py-2'>
            <Link2 className='h-4 w-4 shrink-0 text-studio-violet/50' />
            <code className='flex-1 truncate text-xs text-studio-violet'>{url}</code>
            <button
              type='button'
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success(t("copied"));
              }}
              className='shrink-0 text-xs font-medium text-studio-violet underline'
            >
              {t("copy")}
            </button>
          </div>

          <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
            <button
              type='button'
              onClick={() => download(pngDataUrl, "qr-code-jour-j.png")}
              className='flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-studio-violet text-sm font-medium text-white'
            >
              <Download className='h-4 w-4' />
              {t("download_png")}
            </button>
            <button
              type='button'
              onClick={downloadSvg}
              className='flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-studio-violet text-sm font-medium text-studio-violet'
            >
              <Download className='h-4 w-4' />
              {t("download_svg")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Traduire les neuf locales**

Pour `fr` :

```json
"QrCode": {
  "title": "QR Code Jour J",
  "permanent_note": "Ce QR code est définitif. Il ne changera jamais, même si vous modifiez vos tables, votre menu, vos invités ou votre programme. Vous pouvez l'imprimer dès maintenant.",
  "copy": "Copier",
  "copied": "Lien copié",
  "download_png": "Télécharger en PNG",
  "download_svg": "Télécharger en SVG"
}
```

Anglais : Day-of QR code · "This QR code is permanent. It will never change,
even if you edit your tables, menu, guests or schedule. You can have it printed
today." · Copy · Link copied · Download PNG · Download SVG. Traduire aussi dans
`de es pt it ar zh ja`.

- [ ] **Step 5: Vérifier le build**

Run: `cd dashboard && npm run lint && npm run build`
Expected: aucune erreur.

- [ ] **Step 6: Vérifier dans le navigateur**

Ouvrir `/fr/jour-j/qr-code`. Le QR s'affiche; le scanner avec un téléphone
mène à `https://thestudio.fr/jourj/emilie-jordy`; les deux téléchargements
produisent un fichier valide; la note sur la permanence est visible. Vérifier
en 375 px : les boutons s'empilent, le QR reste lisible.

- [ ] **Step 7: Commit**

```bash
git add dashboard/src/app/\[locale\]/jour-j/qr-code dashboard/src/components/jour-j/qr \
        dashboard/package.json dashboard/messages package-lock.json
git commit -m "feat(jour-j): permanent QR code with PNG and SVG export"
```

---

## Task 7: Menu et paramètres Jour J

Deux écrans de formulaire, regroupés : même nature, même mécanique d'état
local, et un reviewer les juge ensemble.

**Files:**
- Create: `dashboard/src/app/[locale]/jour-j/menu/page.tsx`
- Create: `dashboard/src/components/jour-j/menu/MenuEditor.tsx`
- Create: `dashboard/src/components/jour-j/menu/MenuCategoryCard.tsx`
- Create: `dashboard/src/app/[locale]/jour-j/parametres/page.tsx`
- Create: `dashboard/src/components/jour-j/settings/DayOfSettingsForm.tsx`
- Modify: `dashboard/messages/*.json`

**Interfaces:**
- Consumes: `JOUR_J_MOCK.menu`, `JOUR_J_MOCK.settings`, types `MenuCategory`,
  `MenuItem`, `DayOfSettings` (Task 1).
- Produces: rien pour les tâches suivantes.

- [ ] **Step 1: Écrire les pages**

`menu/page.tsx` :

```tsx
import { MenuEditor } from "@/components/jour-j/menu/MenuEditor";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function MenuPage() {
  return <MenuEditor initialMenu={JOUR_J_MOCK.menu} />;
}
```

`parametres/page.tsx` :

```tsx
import { DayOfSettingsForm } from "@/components/jour-j/settings/DayOfSettingsForm";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function DayOfSettingsPage() {
  return <DayOfSettingsForm initialSettings={JOUR_J_MOCK.settings} />;
}
```

- [ ] **Step 2: Écrire la carte de catégorie**

```tsx
"use client";

import type { MenuCategory, MenuItem } from "@shared/types/jour-j";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  category: MenuCategory;
  onToggle: () => void;
  onAddItem: (item: MenuItem) => void;
  onRemoveItem: (itemId: string) => void;
};

export function MenuCategoryCard({
  category,
  onToggle,
  onAddItem,
  onRemoveItem,
}: Props) {
  const t = useTranslations("DayOfMenu");
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onAddItem({ id: `mi-${crypto.randomUUID()}`, name });
    setDraft("");
  };

  return (
    <section className='rounded-xl border border-studio-lavande/40 bg-white p-4'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-heading text-sm text-studio-violet'>
          {t(`categories.${category.key}`)}
        </h2>
        <label className='flex min-h-11 shrink-0 items-center gap-2 text-xs text-studio-violet/70'>
          <input
            type='checkbox'
            checked={category.enabled}
            onChange={onToggle}
            className='h-4 w-4 accent-[#4B3F72]'
          />
          {t("enabled")}
        </label>
      </div>

      {category.enabled && (
        <>
          <ul className='mt-3 space-y-1'>
            {category.items.map((item) => (
              <li
                key={item.id}
                className='flex min-h-11 items-center justify-between rounded-lg bg-studio-creme px-3 text-sm text-studio-violet'
              >
                <span className='truncate'>
                  {item.name}
                  {item.description && (
                    <span className='ml-2 text-xs text-studio-violet/50'>
                      {item.description}
                    </span>
                  )}
                </span>
                <button
                  type='button'
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={t("remove_item")}
                  className='flex h-11 w-11 shrink-0 items-center justify-center'
                >
                  <Trash2 className='h-4 w-4 text-studio-violet/40 hover:text-red-500' />
                </button>
              </li>
            ))}
          </ul>

          <div className='mt-2 flex gap-2'>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={t("add_placeholder")}
              className='min-h-11 flex-1 rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
            />
            <button
              type='button'
              onClick={add}
              aria-label={t("add_item")}
              className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-studio-violet text-white'
            >
              <Plus className='h-4 w-4' />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Écrire l'éditeur**

```tsx
"use client";

import type { MenuCategory, MenuItem } from "@shared/types/jour-j";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MenuCategoryCard } from "./MenuCategoryCard";

export function MenuEditor({ initialMenu }: { initialMenu: MenuCategory[] }) {
  const t = useTranslations("DayOfMenu");
  const [menu, setMenu] = useState(initialMenu);

  const update = (id: string, fn: (c: MenuCategory) => MenuCategory) =>
    setMenu((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        <div className='mt-6 space-y-3'>
          {[...menu]
            .sort((a, b) => a.position - b.position)
            .map((category) => (
              <MenuCategoryCard
                key={category.id}
                category={category}
                onToggle={() =>
                  update(category.id, (c) => ({ ...c, enabled: !c.enabled }))
                }
                onAddItem={(item: MenuItem) =>
                  update(category.id, (c) => ({ ...c, items: [...c.items, item] }))
                }
                onRemoveItem={(itemId) =>
                  update(category.id, (c) => ({
                    ...c,
                    items: c.items.filter((i) => i.id !== itemId),
                  }))
                }
              />
            ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Écrire le formulaire de paramètres**

Les deux réglages de galerie sont **indépendants** (§21 du cahier) : voir et
envoyer ne sont pas la même permission.

```tsx
"use client";

import type { DayOfSettings } from "@shared/types/jour-j";
import { useTranslations } from "next-intl";
import { useState } from "react";

function Toggle({
  label, hint, checked, onChange,
}: {
  label: string; hint: string; checked: boolean; onChange: () => void;
}) {
  return (
    <label className='flex min-h-14 cursor-pointer items-start justify-between gap-4 border-b border-studio-lavande/30 py-3 last:border-0'>
      <span>
        <span className='block text-sm font-medium text-studio-violet'>{label}</span>
        <span className='mt-0.5 block text-xs text-studio-violet/60'>{hint}</span>
      </span>
      <input
        type='checkbox'
        checked={checked}
        onChange={onChange}
        className='mt-1 h-5 w-5 shrink-0 accent-[#4B3F72]'
      />
    </label>
  );
}

export function DayOfSettingsForm({
  initialSettings,
}: {
  initialSettings: DayOfSettings;
}) {
  const t = useTranslations("DayOfSettings");
  const [settings, setSettings] = useState(initialSettings);

  const toggle = (key: keyof DayOfSettings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>

        <div className='mt-6 rounded-2xl border border-studio-lavande/40 bg-white px-4 shadow-studio-card'>
          <Toggle
            label={t("enabled_label")}
            hint={t("enabled_hint")}
            checked={settings.enabled}
            onChange={() => toggle("enabled")}
          />
          {/* Sharing and browsing are two separate permissions — §21. */}
          <Toggle
            label={t("gallery_visible_label")}
            hint={t("gallery_visible_hint")}
            checked={settings.galleryVisibleToGuests}
            onChange={() => toggle("galleryVisibleToGuests")}
          />
          <Toggle
            label={t("after_wedding_label")}
            hint={t("after_wedding_hint")}
            checked={settings.afterWeddingMode}
            onChange={() => toggle("afterWeddingMode")}
          />

          <label className='flex min-h-14 flex-col justify-center gap-1 border-t border-studio-lavande/30 py-3'>
            <span className='text-sm font-medium text-studio-violet'>
              {t("uploads_until_label")}
            </span>
            <span className='text-xs text-studio-violet/60'>
              {t("uploads_until_hint")}
            </span>
            <input
              type='date'
              value={settings.uploadsOpenUntil.slice(0, 10)}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  uploadsOpenUntil: new Date(e.target.value).toISOString(),
                }))
              }
              className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet sm:w-56'
            />
          </label>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Traduire les neuf locales**

Pour `fr` :

```json
"DayOfMenu": {
  "title": "Menu du Jour J",
  "subtitle": "Activez les catégories que vous servez et ajoutez vos plats.",
  "enabled": "Activée",
  "add_placeholder": "Ajouter un plat…",
  "add_item": "Ajouter",
  "remove_item": "Supprimer",
  "categories": {
    "cocktail": "Cocktail",
    "starter": "Entrée",
    "main": "Plat",
    "cheese": "Fromage",
    "dessert": "Dessert",
    "drinks": "Boissons"
  }
},
"DayOfSettings": {
  "title": "Paramètres Jour J",
  "enabled_label": "Activer le module Jour J",
  "enabled_hint": "Vos invités accèdent à leur table, au menu et aux photos après avoir scanné le QR code.",
  "gallery_visible_label": "Galerie visible par les invités",
  "gallery_visible_hint": "Indépendant de l'envoi : vos invités peuvent toujours partager leurs photos même si la galerie reste privée.",
  "after_wedding_label": "Mode après-mariage",
  "after_wedding_hint": "La page passe en mode « Merci » et reste ouverte aux envois.",
  "uploads_until_label": "Envois ouverts jusqu'au",
  "uploads_until_hint": "Au-delà de cette date, vos invités ne peuvent plus ajouter de photos."
}
```

Anglais : Day-of menu / "Switch on the courses you're serving and add your
dishes." / Enabled / Add a dish… / Add / Remove / Cocktail, Starter, Main,
Cheese, Dessert, Drinks. Settings : Day-of settings / Turn on the day-of module
/ "Your guests reach their table, the menu and the photos after scanning the QR
code." / Gallery visible to guests / "Separate from uploading: guests can still
share photos even while the gallery stays private." / After-wedding mode / "The
page switches to a thank-you view and stays open to uploads." / Uploads open
until / "Past this date, guests can no longer add photos." Traduire aussi dans
`de es pt it ar zh ja`.

- [ ] **Step 6: Vérifier le build**

Run: `cd dashboard && npm run lint && npm run build`
Expected: aucune erreur.

- [ ] **Step 7: Vérifier dans le navigateur**

`/fr/jour-j/menu` : six catégories, « Boissons » désactivée par défaut;
décocher masque les plats; ajouter et supprimer fonctionne.
`/fr/jour-j/parametres` : les quatre réglages répondent. Les deux écrans
vérifiés en 375 px.

- [ ] **Step 8: Commit**

```bash
git add dashboard/src/app/\[locale\]/jour-j/menu dashboard/src/app/\[locale\]/jour-j/parametres \
        dashboard/src/components/jour-j/menu dashboard/src/components/jour-j/settings dashboard/messages
git commit -m "feat(jour-j): menu editor and day-of settings"
```

---

## Task 8: Galerie photos & vidéos

**Files:**
- Create: `dashboard/src/app/[locale]/jour-j/photos/page.tsx`
- Create: `dashboard/src/components/jour-j/media/MediaGrid.tsx`
- Create: `dashboard/src/components/jour-j/media/MediaTile.tsx`
- Modify: `dashboard/messages/*.json`

**Interfaces:**
- Consumes: `JOUR_J_MOCK.media`, type `GuestMedia` (Task 1).
- Produces: rien pour les tâches suivantes.

- [ ] **Step 1: Écrire la page**

```tsx
import { MediaGrid } from "@/components/jour-j/media/MediaGrid";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function DayOfPhotosPage() {
  return <MediaGrid initialMedia={JOUR_J_MOCK.media} />;
}
```

- [ ] **Step 2: Écrire la vignette**

```tsx
"use client";

import type { GuestMedia } from "@shared/types/jour-j";
import { Download, Eye, EyeOff, Play, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  media: GuestMedia;
  onToggleHidden: () => void;
  onDelete: () => void;
};

export function MediaTile({ media, onToggleHidden, onDelete }: Props) {
  const t = useTranslations("DayOfPhotos");

  return (
    <figure className='group relative aspect-square overflow-hidden rounded-lg bg-studio-beige'>
      {/* eslint-disable-next-line @next/next/no-img-element -- guest uploads are
          arbitrary remote URLs; step 2 moves them to Supabase storage. */}
      <img
        src={media.thumbUrl}
        alt=''
        loading='lazy'
        className={`h-full w-full object-cover ${media.hidden ? "opacity-40" : ""}`}
      />

      {media.kind === "video" && (
        <span className='absolute left-2 top-2 rounded-full bg-black/50 p-1'>
          <Play className='h-3 w-3 text-white' />
        </span>
      )}

      {media.hidden && (
        <span className='absolute right-2 top-2 rounded-full bg-black/50 p-1'>
          <EyeOff className='h-3 w-3 text-white' />
        </span>
      )}

      {/* Always visible on touch: there is no hover on a phone. */}
      <figcaption className='absolute inset-x-0 bottom-0 flex items-center justify-end gap-0.5 bg-gradient-to-t from-black/70 to-transparent p-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100'>
        <a
          href={media.url}
          download
          aria-label={t("download")}
          className='flex h-9 w-9 items-center justify-center'
        >
          <Download className='h-4 w-4 text-white' />
        </a>
        <button
          type='button'
          onClick={onToggleHidden}
          aria-label={media.hidden ? t("show") : t("hide")}
          className='flex h-9 w-9 items-center justify-center'
        >
          {media.hidden ? (
            <Eye className='h-4 w-4 text-white' />
          ) : (
            <EyeOff className='h-4 w-4 text-white' />
          )}
        </button>
        <button
          type='button'
          onClick={onDelete}
          aria-label={t("delete")}
          className='flex h-9 w-9 items-center justify-center'
        >
          <Trash2 className='h-4 w-4 text-white' />
        </button>
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 3: Écrire la grille**

Deux colonnes sur mobile, quatre en desktop.

```tsx
"use client";

import type { GuestMedia } from "@shared/types/jour-j";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MediaTile } from "./MediaTile";

type Filter = "all" | "photo" | "video" | "hidden";

export function MediaGrid({ initialMedia }: { initialMedia: GuestMedia[] }) {
  const t = useTranslations("DayOfPhotos");
  const [media, setMedia] = useState(initialMedia);
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (filter === "hidden") return media.filter((m) => m.hidden);
    if (filter === "all") return media;
    return media.filter((m) => m.kind === filter);
  }, [media, filter]);

  const counts = useMemo(
    () => ({
      all: media.length,
      photo: media.filter((m) => m.kind === "photo").length,
      video: media.filter((m) => m.kind === "video").length,
      hidden: media.filter((m) => m.hidden).length,
    }),
    [media],
  );

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-5xl'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
            <p className='mt-1 text-sm text-studio-violet/70'>
              {t("count", { count: media.length })}
            </p>
          </div>
          <button
            type='button'
            onClick={() => toast.info(t("zip_pending"))}
            className='flex min-h-12 items-center justify-center gap-2 rounded-lg bg-studio-violet px-4 text-sm font-medium text-white'
          >
            <Download className='h-4 w-4' />
            {t("download_all")}
          </button>
        </div>

        <div className='mt-4 flex gap-2 overflow-x-auto pb-1'>
          {(["all", "photo", "video", "hidden"] as const).map((key) => (
            <button
              key={key}
              type='button'
              onClick={() => setFilter(key)}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm transition-colors ${
                filter === key
                  ? "bg-studio-violet text-white"
                  : "bg-white text-studio-violet"
              }`}
            >
              {t(`filters.${key}`)} ({counts[key]})
            </button>
          ))}
        </div>

        <div className='mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4'>
          {visible.map((item) => (
            <MediaTile
              key={item.id}
              media={item}
              onToggleHidden={() =>
                setMedia((prev) =>
                  prev.map((m) =>
                    m.id === item.id ? { ...m, hidden: !m.hidden } : m,
                  ),
                )
              }
              onDelete={() =>
                setMedia((prev) => prev.filter((m) => m.id !== item.id))
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Traduire les neuf locales**

Pour `fr` :

```json
"DayOfPhotos": {
  "title": "Photos & vidéos",
  "count": "{count} contenu(s) partagé(s) par vos invités",
  "download_all": "Tout télécharger",
  "zip_pending": "Le téléchargement groupé sera disponible une fois les vraies photos branchées.",
  "download": "Télécharger",
  "hide": "Masquer",
  "show": "Afficher",
  "delete": "Supprimer",
  "filters": {
    "all": "Tout",
    "photo": "Photos",
    "video": "Vidéos",
    "hidden": "Masqués"
  }
}
```

Anglais : Photos & videos · "{count} item(s) shared by your guests" · Download
all · "Bulk download arrives once the real photos are wired up." · Download ·
Hide · Show · Delete · All / Photos / Videos / Hidden. Traduire aussi dans
`de es pt it ar zh ja`.

- [ ] **Step 5: Vérifier le build**

Run: `cd dashboard && npm run lint && npm run build`
Expected: aucune erreur.

- [ ] **Step 6: Vérifier dans le navigateur**

`/fr/jour-j/photos` : 286 contenus, les filtres donnent 260 photos / 26 vidéos
/ 8 masqués; masquer grise la vignette; supprimer la retire. En 375 px : deux
colonnes, les actions visibles sans survol, aucun scroll horizontal.

- [ ] **Step 7: Commit**

```bash
git add dashboard/src/app/\[locale\]/jour-j/photos dashboard/src/components/jour-j/media dashboard/messages
git commit -m "feat(jour-j): guest media gallery with hide and delete"
```

---

## Task 9: Page invité `/jourj/[slug]` — landing

Le seul écran dont le contexte d'usage est **exclusivement** mobile : on le
scanne à table. Aucune maquette desktop n'est due; la page se contente de rester
centrée et lisible au-delà de 640 px.

**Files:**
- Create: `landing/src/app/[locale]/jourj/[slug]/layout.tsx`
- Create: `landing/src/app/[locale]/jourj/[slug]/page.tsx`
- Create: `landing/src/app/[locale]/jourj/[slug]/ma-table/page.tsx`
- Create: `landing/src/app/[locale]/jourj/[slug]/menu/page.tsx`
- Create: `landing/src/app/[locale]/jourj/[slug]/photos/page.tsx`
- Create: `landing/src/components/jourj/GuestNav.tsx`
- Create: `landing/src/components/jourj/TableFinder.tsx`
- Create: `landing/src/components/jourj/PhotoUpload.tsx`

**Interfaces:**
- Consumes: `JOUR_J_MOCK` (Task 1), `searchSeatedGuests` (Task 2).
- Produces: rien — dernière tâche.

- [ ] **Step 1: Écrire le layout**

```tsx
import { GuestNav } from "@/components/jourj/GuestNav";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import { notFound } from "next/navigation";

/**
 * The page a guest lands on after scanning the QR code. Phone-only in
 * practice — laid out for a thumb, capped at a readable width beyond that.
 *
 * Step 2 of the spec resolves `slug` through
 * `sites.slug → weddings → sites.theme_id → resolveTheme()` so the page wears
 * the couple's own art direction. Until then it uses the studio palette.
 */
export default async function JourJLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== JOUR_J_MOCK.settings.qrSlug) notFound();
  if (!JOUR_J_MOCK.settings.enabled) notFound();

  return (
    <div className='flex min-h-[100svh] flex-col bg-studio-creme'>
      <main className='mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-8'>
        {children}
      </main>
      <GuestNav slug={slug} />
    </div>
  );
}
```

- [ ] **Step 2: Écrire la navigation basse**

Une barre fixe en bas — la zone atteignable au pouce.

```tsx
"use client";

import { cn } from "@shared/lib/utils";
import { Image as ImageIcon, MapPin, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "ma-table", label: "Ma table", icon: MapPin },
  { key: "menu", label: "Le menu", icon: UtensilsCrossed },
  { key: "photos", label: "Nos photos", icon: ImageIcon },
];

export function GuestNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  return (
    <nav className='fixed inset-x-0 bottom-0 border-t border-studio-lavande/40 bg-white/95 backdrop-blur'>
      <ul className='mx-auto flex max-w-md'>
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = pathname.includes(`/${key}`);
          return (
            <li key={key} className='flex-1'>
              <Link
                href={`/jourj/${slug}/${key}`}
                className={cn(
                  // pb-6 clears the iOS home indicator.
                  "flex min-h-16 flex-col items-center justify-center gap-1 pb-6 pt-2 text-xs",
                  active ? "text-studio-violet" : "text-studio-violet/50",
                )}
              >
                <Icon className='h-5 w-5' />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Écrire l'accueil**

```tsx
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import Link from "next/link";

export default async function JourJHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { afterWeddingMode } = JOUR_J_MOCK.settings;

  return (
    <div className='text-center'>
      <p className='text-xs uppercase tracking-[0.2em] text-studio-violet/50'>
        {afterWeddingMode ? "Merci" : "Bienvenue"}
      </p>
      <h1 className='mt-3 font-heading text-3xl text-studio-violet'>
        Émilie &amp; Jordy
      </h1>
      <p className='mt-4 text-sm text-studio-violet/70'>
        {afterWeddingMode
          ? "Merci d'avoir partagé cette journée avec nous. Vos photos sont toujours les bienvenues."
          : "Retrouvez votre table, le menu du jour et partagez vos photos."}
      </p>

      <div className='mt-8 space-y-2'>
        <Link
          href={`/jourj/${slug}/ma-table`}
          className='flex min-h-14 items-center justify-center rounded-xl bg-studio-violet text-sm font-medium text-white'
        >
          Trouver ma table
        </Link>
        <Link
          href={`/jourj/${slug}/photos`}
          className='flex min-h-14 items-center justify-center rounded-xl border border-studio-violet text-sm font-medium text-studio-violet'
        >
          Partager mes photos
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Écrire « Ma table »**

La confidentialité du §16 est portée par `searchSeatedGuests` (Task 2) : deux
caractères minimum, cinq résultats, aucun champ de contact.

```tsx
"use client";

import { searchSeatedGuests } from "@shared/lib/seating";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export function TableFinder() {
  const [query, setQuery] = useState("");
  const { tables, guests } = JOUR_J_MOCK;

  const matches = useMemo(
    () => searchSeatedGuests(tables, guests, query),
    [tables, guests, query],
  );

  const tooShort = query.trim().length > 0 && query.trim().length < 2;

  return (
    <div>
      <h1 className='font-heading text-2xl text-studio-violet'>Ma table</h1>
      <p className='mt-2 text-sm text-studio-violet/70'>
        Entrez votre prénom ou votre nom.
      </p>

      <label className='relative mt-5 block'>
        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-studio-violet/40' />
        <input
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete='off'
          placeholder='Marie…'
          className='min-h-14 w-full rounded-xl border border-studio-lavande/50 bg-white pl-10 pr-4 text-base text-studio-violet'
        />
      </label>

      {tooShort && (
        <p className='mt-3 text-xs text-studio-violet/50'>
          Encore une lettre…
        </p>
      )}

      <ul className='mt-4 space-y-2'>
        {matches.map((m) => (
          <li
            key={`${m.firstName}-${m.lastName}-${m.tableName}`}
            className='rounded-xl border border-studio-lavande/40 bg-white p-5 text-center'
          >
            <p className='text-sm text-studio-violet/70'>
              {m.firstName}, votre table est…
            </p>
            <p className='mt-2 font-heading text-2xl uppercase tracking-wide text-studio-violet'>
              {m.tableName}
            </p>
            {m.seatsLabel && (
              <p className='mt-1 text-xs text-studio-violet/50'>{m.seatsLabel}</p>
            )}
          </li>
        ))}
      </ul>

      {query.trim().length >= 2 && matches.length === 0 && (
        <p className='mt-4 text-center text-sm text-studio-violet/60'>
          Aucun résultat. Vérifiez l'orthographe ou demandez aux mariés.
        </p>
      )}
    </div>
  );
}
```

Et la page qui la monte :

```tsx
import { TableFinder } from "@/components/jourj/TableFinder";

export default function MaTablePage() {
  return <TableFinder />;
}
```

- [ ] **Step 5: Écrire le menu**

```tsx
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

const LABELS: Record<string, string> = {
  cocktail: "Cocktail",
  starter: "Entrée",
  main: "Plat",
  cheese: "Fromage",
  dessert: "Dessert",
  drinks: "Boissons",
};

export default function GuestMenuPage() {
  const categories = JOUR_J_MOCK.menu
    .filter((c) => c.enabled)
    .sort((a, b) => a.position - b.position);

  return (
    <div>
      <h1 className='text-center font-heading text-2xl text-studio-violet'>
        Le menu
      </h1>

      <div className='mt-8 space-y-8'>
        {categories.map((category) => (
          <section key={category.id} className='text-center'>
            <h2 className='text-xs uppercase tracking-[0.2em] text-studio-violet/50'>
              {LABELS[category.key]}
            </h2>
            <ul className='mt-3 space-y-2'>
              {category.items.map((item) => (
                <li key={item.id} className='text-sm text-studio-violet'>
                  {item.name}
                  {item.description && (
                    <span className='mt-0.5 block text-xs text-studio-violet/50'>
                      {item.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Écrire l'upload de photos**

Sans compte ni application (§19). Le champ ouvre directement l'appareil photo.
Les deux permissions du §21 sont respectées : on peut envoyer même quand la
galerie n'est pas consultable.

```tsx
"use client";

import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";
import { Camera } from "lucide-react";
import { useState } from "react";

export function PhotoUpload() {
  const [pending, setPending] = useState<string[]>([]);
  const { galleryVisibleToGuests, media } = {
    galleryVisibleToGuests: JOUR_J_MOCK.settings.galleryVisibleToGuests,
    media: JOUR_J_MOCK.media,
  };

  const visible = media.filter((m) => !m.hidden).slice(0, 30);

  return (
    <div>
      <h1 className='text-center font-heading text-2xl text-studio-violet'>
        Nos photos
      </h1>
      <p className='mt-2 text-center text-sm text-studio-violet/70'>
        Partagez vos photos et vidéos, sans créer de compte.
      </p>

      <label className='mt-6 flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl bg-studio-violet text-sm font-medium text-white'>
        <Camera className='h-4 w-4' />
        Ajouter mes photos
        <input
          type='file'
          accept='image/*,video/*'
          multiple
          capture='environment'
          className='hidden'
          onChange={(e) => {
            // Mock: names only. Step 2 compresses and uploads to storage.
            const names = Array.from(e.target.files ?? []).map((f) => f.name);
            setPending((prev) => [...prev, ...names]);
          }}
        />
      </label>

      {pending.length > 0 && (
        <p className='mt-3 text-center text-xs text-studio-violet/60'>
          {pending.length} fichier(s) prêt(s) à être envoyés — l'envoi réel
          arrive avec le branchement.
        </p>
      )}

      {galleryVisibleToGuests ? (
        <div className='mt-8 grid grid-cols-3 gap-1.5'>
          {visible.map((item) => (
            /* eslint-disable-next-line @next/next/no-img-element -- remote
               guest uploads; moves to Supabase storage in step 2. */
            <img
              key={item.id}
              src={item.thumbUrl}
              alt=''
              loading='lazy'
              className='aspect-square w-full rounded-md object-cover'
            />
          ))}
        </div>
      ) : (
        <p className='mt-8 text-center text-xs text-studio-violet/50'>
          Les mariés ont choisi de garder la galerie privée. Vos photos leur
          parviennent bien.
        </p>
      )}
    </div>
  );
}
```

Et la page :

```tsx
import { PhotoUpload } from "@/components/jourj/PhotoUpload";

export default function GuestPhotosPage() {
  return <PhotoUpload />;
}
```

- [ ] **Step 7: Vérifier le build**

Run:
```bash
cd landing && npm run lint && npm run build
```
Expected: aucune erreur.

- [ ] **Step 8: Vérifier sur mobile**

Run `npm run dev:landing` (port 3010). Ouvrir
`http://localhost:3010/fr/jourj/emilie-jordy` en 375 px :

- la barre du bas est atteignable au pouce, les trois onglets font ≥ 44 px;
- « Ma table » : taper `m` ne montre rien, `mar` affiche au plus cinq résultats
  et jamais la liste complète; un invité non placé ou non confirmé n'apparaît
  jamais;
- le menu n'affiche pas « Boissons » (catégorie désactivée);
- « Nos photos » : le bouton ouvre le sélecteur, la grille fait trois colonnes;
- un slug inconnu (`/fr/jourj/inconnu`) renvoie un 404;
- aucun scroll horizontal sur les quatre écrans.

- [ ] **Step 9: Commit**

```bash
git add landing/src/app/\[locale\]/jourj landing/src/components/jourj
git commit -m "feat(jour-j): guest-facing page behind the QR code

Phone-only by design — it is scanned at a dinner table. The table lookup
never returns the guest list: two characters minimum, five results, no
contact details."
```

---

## Recette finale — avant de montrer au client

- [ ] `npm test` à la racine : les 12 tests de placement passent.
- [ ] `cd dashboard && npm run lint && npm run build` : propre.
- [ ] `cd landing && npm run lint && npm run build` : propre.
- [ ] Les neuf locales ont les mêmes clés (script de Task 3, Step 7).
- [ ] Parcours des six sections en 375 px puis en 1440 px, sans scroll
      horizontal ni cible tactile sous 44 px.
- [ ] Le parcours du cahier tient de bout en bout : Invité → Invitation →
      RSVP → Informations → Jour J → Table → Menu → Photos.

Ensuite : validation client sur l'UX, **puis** le plan de l'étape 2
(branchement Supabase), qui n'est volontairement pas écrit ici — son contenu
dépend de ce que le client aura validé.

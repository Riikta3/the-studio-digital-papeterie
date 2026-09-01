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
    // A full 12-seat card runs ~380px tall, so rows are spaced clear of that
    // rather than the card's empty height — at 240 they overlapped.
    x: 120 + (i % 4) * 260,
    y: 120 + Math.floor(i / 4) * 430,
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

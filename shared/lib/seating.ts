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

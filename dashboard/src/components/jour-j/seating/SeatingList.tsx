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

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
    /* Desktop pins the layout to the viewport so the guest panel and the
       board scroll independently; mobile keeps a normal page scroll. */
    <div className='flex min-h-screen flex-col bg-studio-creme md:h-screen md:min-h-0 md:overflow-hidden'>
      <SeatingHeader summary={summary} query={query} onQueryChange={setQuery} />

      {/* Desktop: drag & drop board. */}
      <div className='hidden min-h-0 flex-1 md:flex'>
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

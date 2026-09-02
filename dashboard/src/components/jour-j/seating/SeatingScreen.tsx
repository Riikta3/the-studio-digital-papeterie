"use client";

import { assignGuestToTable, moveTable, unassignGuest as unassignGuestAction } from "@/actions/seating-actions";
import type { SeatingGuest } from "@/lib/db/projections";
import type { DayOfTable } from "@shared/types/jour-j";
import {
  assignGuest,
  seatingSummary,
  unassignGuest,
  unseatedGuests,
} from "@shared/lib/seating";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SeatingBoard } from "./SeatingBoard";
import { SeatingHeader } from "./SeatingHeader";
import { SeatingList } from "./SeatingList";

// Only this prop type changes across the seating folder: `SeatingGuest` is
// `DayOfGuest` minus `dietary`, plus `tableId`, and is structurally
// assignable to `DayOfGuest` — the five other files (SeatingBoard,
// SeatingList, TableCard, UnseatedPanel, AssignGuestsSheet) stay typed
// against `DayOfGuest` and compile unchanged.
type Props = { initialTables: DayOfTable[]; guests: SeatingGuest[] };

export function SeatingScreen({ initialTables, guests }: Props) {
  const t = useTranslations("Seating");
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

  const onAssign = async (guestId: string, tableId: string) => {
    const previous = tables;
    const next = assignGuest(previous, guestId, tableId);
    // assignGuest returns the same array when the table is full. Without
    // this check the couple gets no feedback at all — the pill just springs
    // back with no explanation.
    if (next === previous) {
      toast.error(t("table_full"));
      return;
    }
    setTables(next);
    const res = await assignGuestToTable(guestId, tableId);
    if (!res.success) {
      setTables(previous);
      toast.error(res.error || t("assign_failed"));
    }
  };

  const onUnassign = async (guestId: string) => {
    const previous = tables;
    setTables((prev) => unassignGuest(prev, guestId));
    const res = await unassignGuestAction(guestId);
    if (!res.success) {
      setTables(previous);
      toast.error(res.error || t("unassign_failed"));
    }
  };

  // A drag fires dozens of move events; only the last one is worth a round
  // trip. Local state updates immediately so the card follows the cursor;
  // the write is debounced.
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (moveTimer.current) clearTimeout(moveTimer.current);
    };
  }, []);

  const onMoveTable = (tableId: string, x: number, y: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, x, y } : t)),
    );
    if (moveTimer.current) clearTimeout(moveTimer.current);
    moveTimer.current = setTimeout(() => {
      void moveTable(tableId, x, y).then((res) => {
        if (!res.success) toast.error(res.error || t("move_failed"));
      });
    }, 400);
  };

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

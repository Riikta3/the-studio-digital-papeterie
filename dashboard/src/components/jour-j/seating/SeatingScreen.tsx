"use client";

import {
  assignGuestToTable,
  createTable,
  deleteTable,
  moveTable,
  unassignGuest as unassignGuestAction,
  updateTable,
} from "@/actions/seating-actions";
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
import { TableDialog } from "./TableDialog";

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
  /**
   * Which table the dialog is editing. `"new"` opens it empty; a table id
   * opens it on that table; `null` keeps it closed. One piece of state rather
   * than an open flag plus a selection, so the two cannot disagree.
   */
  const [editing, setEditing] = useState<string | "new" | null>(null);

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
      return;
    }
    toast.success(t("assigned_toast"));
  };

  const onUnassign = async (guestId: string) => {
    const previous = tables;
    setTables((prev) => unassignGuest(prev, guestId));
    const res = await unassignGuestAction(guestId);
    if (!res.success) {
      setTables(previous);
      toast.error(res.error || t("unassign_failed"));
      return;
    }
    toast.success(t("unassigned_toast"));
  };

  // A drag fires dozens of move events; only the last one is worth a round
  // trip. Local state updates immediately so the card follows the cursor;
  // the write is debounced. No success toast on this path, ever: a toast per
  // drag (or per debounced write) would fire constantly while repositioning
  // tables on the board and would be maddening.
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

  const editingTable =
    editing && editing !== "new"
      ? tables.find((tbl) => tbl.id === editing)
      : undefined;

  const saveTable = async (values: {
    name: string;
    capacity: number;
    seatsLabel?: string;
  }) => {
    if (editing === "new") {
      // Await the server and adopt its id: a client-minted string is not a
      // valid uuid, and every later write on the table would miss.
      const res = await createTable(values);
      if (!res.success) {
        toast.error(res.error || t("save_failed"));
        return;
      }
      setTables((prev) => [...prev, res.table]);
      toast.success(t("table_added"));
      return;
    }

    if (!editingTable) return;
    const previous = tables;
    setTables((prev) =>
      prev.map((tbl) =>
        tbl.id === editingTable.id
          ? { ...tbl, ...values, seatsLabel: values.seatsLabel }
          : tbl,
      ),
    );
    const res = await updateTable(editingTable.id, {
      name: values.name,
      capacity: values.capacity,
      seatsLabel: values.seatsLabel ?? null,
    });
    if (!res.success) {
      setTables(previous);
      toast.error(res.error || t("save_failed"));
      return;
    }
    toast.success(t("table_saved"));
  };

  const removeTable = async () => {
    if (!editingTable) return;
    const previous = tables;
    setTables((prev) => prev.filter((tbl) => tbl.id !== editingTable.id));
    const res = await deleteTable(editingTable.id);
    if (!res.success) {
      setTables(previous);
      toast.error(res.error || t("delete_failed"));
      return;
    }
    toast.success(t("table_deleted"));
  };

  return (
    /* Desktop pins the layout to the viewport so the guest panel and the
       board scroll independently; mobile keeps a normal page scroll. */
    <div className='flex min-h-screen flex-col bg-studio-creme md:h-screen md:min-h-0 md:overflow-hidden'>
      <SeatingHeader
        summary={summary}
        query={query}
        onQueryChange={setQuery}
        onAddTable={() => setEditing("new")}
      />

      {/* Desktop: drag & drop board. */}
      <div className='hidden min-h-0 flex-1 md:flex'>
        <SeatingBoard
          tables={tables}
          guestsById={guestsById}
          unseated={filteredUnseated}
          onAssign={onAssign}
          onUnassign={onUnassign}
          onMoveTable={onMoveTable}
          onEditTable={setEditing}
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
          onEditTable={setEditing}
        />
      </div>

      <TableDialog
        open={editing !== null}
        onOpenChange={(open) => setEditing(open ? editing : null)}
        table={editingTable}
        seatedCount={editingTable?.guestIds.length ?? 0}
        onSubmit={saveTable}
        onDelete={editingTable ? removeTable : undefined}
      />
    </div>
  );
}

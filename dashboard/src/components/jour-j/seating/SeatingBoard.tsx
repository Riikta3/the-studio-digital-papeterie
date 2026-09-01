"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
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
  // The guest currently being dragged, rendered in the overlay so the pill
  // follows the cursor instead of staying put in a panel that scrolls.
  const [draggedGuest, setDraggedGuest] = useState<DayOfGuest | null>(null);

  // 8px of travel before a drag starts, so a click to remove still registers.
  // Touch waits instead of measuring distance, so a tablet can still scroll
  // the panel with a flick — only a deliberate press-and-hold starts a drag.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current;
    if (data?.type === "guest") {
      setDraggedGuest(guestsById.get(data.guestId as string) ?? null);
    }
  };

  const handleDragEnd = ({ active, over, delta }: DragEndEvent) => {
    setDraggedGuest(null);

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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      // Escape or a lost pointer cancels the drag; without this the overlay
      // would stay stuck to the cursor.
      onDragCancel={() => setDraggedGuest(null)}
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

      {/* Rendered at the cursor, outside the scrolling panel's overflow. */}
      <DragOverlay dropAnimation={null}>
        {draggedGuest && (
          <div className='cursor-grabbing rounded-lg border border-studio-violet bg-white px-3 py-2 text-sm text-studio-violet shadow-lg'>
            {draggedGuest.firstName} {draggedGuest.lastName}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

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

"use client";

import { assignGuestToTable } from "@/actions/guest-actions";
import { updateTablePosition } from "@/actions/table-actions";
import { Guest, Table } from "@/types";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useState } from "react";
import { GuestSidebar } from "./GuestSidebar";
import { TableNode } from "./TableNode";

interface SeatingCanvasProps {
  initialTables: Table[];
  initialGuests: Guest[];
}

export function SeatingCanvas({
  initialTables,
  initialGuests,
}: SeatingCanvasProps) {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  // const [activeId, setActiveId] = useState<string | null>(null); // Removed unused
  const [activeItem, setActiveItem] = useState<any>(null); // Guest or Table

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Must drag 10px to start (prevents accidental clicks)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    // setActiveId(event.active.id as string);
    setActiveItem(event.active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event;
    // setActiveId(null);
    setActiveItem(null);

    // Case 1: Dragging a Table (repositioning)
    if (active.data.current?.type === "table") {
      const tableId = active.data.current.table.id;
      const currentTable = tables.find((t) => t.id === tableId);

      if (currentTable) {
        const newX = currentTable.x_position + delta.x;
        const newY = currentTable.y_position + delta.y;

        // Optimistic update
        setTables((prev) =>
          prev.map((t) =>
            t.id === tableId ? { ...t, x_position: newX, y_position: newY } : t,
          ),
        );

        // Server action
        await updateTablePosition(tableId, newX, newY);
      }
    }

    // Case 2: Dragging a Guest (assigning to table)
    if (active.data.current?.type === "guest" && over) {
      // Dragging from sidebar to table
      const draggedGuest = active.data.current.guest;
      const guestId = draggedGuest.id;
      const overId = over.id as string;

      // Check if dropped on a table
      if (overId.startsWith("table-drop-")) {
        const tableId =
          active.data.current.table?.id || over.data.current?.tableId; // Get tableId from drop zone data

        if (tableId) {
          // Optimistic update
          setGuests((prev) =>
            prev.map((g) =>
              g.id === guestId ? { ...g, table_id: tableId } : g,
            ),
          );
          setTables((prev) =>
            prev.map((t) => {
              if (t.id === tableId) {
                // check if guest already there (shouldn't be)
                const isAlreadyThere = t.guests?.some((g) => g.id === guestId);
                if (isAlreadyThere) return t;
                return {
                  ...t,
                  guests: [...(t.guests || []), draggedGuest],
                };
              }
              return t;
            }),
          );

          await assignGuestToTable(guestId, tableId);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin} // Use pointerWithin for better UX
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToWindowEdges]}
    >
      <div className='flex h-[calc(100vh-64px)] overflow-hidden'>
        {/* Sidebar */}
        <GuestSidebar guests={guests} />

        {/* Canvas Area */}
        <div className='flex-1 relative bg-studio-creme overflow-auto'>
          <div className='absolute inset-0 min-w-[1000px] min-h-[1000px]'>
            {/* Grid Background Pattern */}
            <div
              className='absolute inset-0 pointer-events-none opacity-10'
              style={{
                backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {tables.map((table) => (
              <TableNode
                key={table.id}
                table={table}
                // Pass updated guests count for rendering?
                // Actually tables state should include guests if we want them to show inside table
                // We need to sync tables state with guests state or just derive guests from 'guests' prop if tables don't store them fully
                // For now assuming tables prop has initial guests and we update via setTables OR update via setGuests and re-derive.
                // Better: derive guests for each table from the master 'guests' list
              />
            ))}
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeItem?.type === "table" ? (
          <div className='p-4 rounded-full border-2 border-primary bg-white shadow-xl opacity-80 cursor-grabbing'>
            {activeItem.table.name}
          </div>
        ) : activeItem?.type === "guest" ? (
          <div className='p-2 rounded bg-white shadow-lg border border-primary truncate max-w-[150px]'>
            {activeItem.guest.first_name} {activeItem.guest.last_name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

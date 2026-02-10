"use client";

import { cn } from "@/lib/utils";
import { Table } from "@/types";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Users } from "lucide-react";

interface TableNodeProps {
  table: Table;
  onTableClick?: (table: Table) => void;
}

export function TableNode({ table, onTableClick }: TableNodeProps) {
  // Draggable for moving the table itself
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging: isTableDragging,
  } = useDraggable({
    id: `table-${table.id}`,
    data: { type: "table", table },
  });

  // Droppable for dropping guests onto the table
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `table-drop-${table.id}`,
    data: { type: "table-drop", tableId: table.id },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${table.x_position}px`,
    top: `${table.y_position}px`,
    position: "absolute" as const,
  };

  const guests = table.guests || [];
  const isFull = guests.length >= table.capacity;

  return (
    <div
      ref={setDraggableRef}
      style={style}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-full border-2 bg-white shadow-md cursor-grab active:cursor-grabbing transition-colors",
        isTableDragging ? "opacity-50" : "opacity-100",
        isOver ? "border-primary bg-primary/10" : "border-border",
        table.shape === "rectangle" ? "rounded-lg" : "rounded-full",
      )}
      {...listeners}
      {...attributes}
      // Combine refs? dnd-kit handles separate refs usually.
      // Actually we might need a wrapper for droppable if we want the WHOLE table to be a drop zone.
    >
      {/* Drop zone wrapper */}
      <div
        ref={setDroppableRef}
        className='w-full h-full flex flex-col items-center justify-center'
      >
        <div className='font-semibold text-sm mb-1'>{table.name}</div>
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          <Users size={12} />
          <span>
            {guests.length}/{table.capacity}
          </span>
        </div>

        {/* Guest List Preview (Tiny) */}
        <div className='mt-2 flex flex-wrap gap-1 justify-center max-w-[100px]'>
          {guests.map((g) => (
            <div
              key={g.id}
              className='w-2 h-2 rounded-full bg-primary'
              title={`${g.first_name} ${g.last_name}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

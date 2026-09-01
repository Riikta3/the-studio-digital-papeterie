"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@shared/lib/utils";
import { X } from "lucide-react";

type Props = {
  table: DayOfTable;
  /** Resolved from the table's own guestIds — the single source of truth. */
  seated: DayOfGuest[];
  onUnassign: (guestId: string) => void;
};

export function TableCard({ table, seated, onUnassign }: Props) {
  const { attributes, listeners, setNodeRef: dragRef, transform } =
    useDraggable({ id: `table-${table.id}`, data: { type: "table", tableId: table.id } });

  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: `drop-${table.id}`,
    data: { type: "table-drop", tableId: table.id },
  });

  const isFull = seated.length >= table.capacity;

  return (
    <div
      ref={dragRef}
      style={{
        transform: CSS.Translate.toString(transform),
        left: table.x,
        top: table.y,
      }}
      className='absolute w-52'
    >
      <div
        ref={dropRef}
        className={cn(
          "rounded-2xl border-2 bg-white p-3 shadow-studio-card transition-colors",
          isOver && !isFull && "border-studio-violet bg-studio-jaune/20",
          isOver && isFull && "border-red-400 bg-red-50",
          !isOver && "border-studio-lavande/50",
        )}
      >
        <div
          {...listeners}
          {...attributes}
          className='mb-2 cursor-grab active:cursor-grabbing'
        >
          <p className='font-heading text-sm text-studio-violet'>{table.name}</p>
          <p className='text-xs text-studio-violet/60'>
            {/* "Table Capri — 8/10", per §13.1 */}
            {seated.length}/{table.capacity}
            {table.seatsLabel ? ` · ${table.seatsLabel}` : ""}
          </p>
        </div>

        <ul className='space-y-0.5'>
          {seated.map((guest) => (
            <li
              key={guest.id}
              className='group flex items-center justify-between rounded px-1.5 py-1 text-xs text-studio-violet hover:bg-studio-creme'
            >
              <span className='truncate'>
                {guest.firstName} {guest.lastName}
              </span>
              <button
                type='button'
                onClick={() => onUnassign(guest.id)}
                className='ml-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                aria-label={`Retirer ${guest.firstName} ${guest.lastName}`}
              >
                <X className='h-3.5 w-3.5 text-studio-violet/50 hover:text-red-500' />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

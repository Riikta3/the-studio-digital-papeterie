"use client";

import type { DayOfGuest } from "@shared/types/jour-j";
import { useDraggable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

export function UnseatedPanel({ guests }: { guests: DayOfGuest[] }) {
  const t = useTranslations("Seating");

  return (
    /* min-h-0 lets this flex child scroll instead of stretching its parent:
       the heading stays put while only the guest list moves, independently
       of the board on the right. */
    <aside className='flex h-full min-h-0 w-72 shrink-0 flex-col border-r border-studio-lavande/30 bg-white'>
      <div className='flex shrink-0 items-center justify-between px-4 pb-3 pt-4'>
        <h2 className='text-sm font-medium text-studio-violet'>
          {t("unseated_title")}
        </h2>
        <span className='rounded-full bg-studio-beige px-2 py-0.5 text-xs text-studio-violet'>
          {guests.length}
        </span>
      </div>

      {guests.length === 0 ? (
        <p className='px-4 py-8 text-center text-sm text-studio-violet/50'>
          {t("all_seated")}
        </p>
      ) : (
        <ul className='min-h-0 flex-1 space-y-1.5 overflow-y-auto px-4 pb-4'>
          {guests.map((guest) => (
            <DraggableGuest key={guest.id} guest={guest} />
          ))}
        </ul>
      )}
    </aside>
  );
}

function DraggableGuest({ guest }: { guest: DayOfGuest }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
    data: { type: "guest", guestId: guest.id },
  });

  return (
    <li
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`touch-none rounded-lg border border-studio-lavande/40 bg-white px-3 py-2 text-sm text-studio-violet ${
        // The DragOverlay renders the pill under the cursor while dragging, so
        // the original is dimmed in place to show where it came from.
        isDragging ? "cursor-grabbing opacity-30" : "cursor-grab"
      }`}
    >
      {guest.firstName} {guest.lastName}
    </li>
  );
}

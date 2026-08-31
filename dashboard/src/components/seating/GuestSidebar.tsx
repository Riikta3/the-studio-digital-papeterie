"use client";

import { Guest } from "@/types";
import { useDraggable } from "@dnd-kit/core";
import { useTranslations } from "next-intl";

interface GuestSidebarProps {
  guests: Guest[];
}

export function GuestSidebar({ guests }: GuestSidebarProps) {
  const t = useTranslations("GuestSidebar");
  const unseatedGuests = guests.filter((g) => !g.table_id);

  return (
    <div className='w-80 border-r border-border bg-card p-4 h-full overflow-y-auto flex-shrink-0'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-semibold text-lg'>{t("title")}</h2>
        <span className='text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full'>
          {unseatedGuests.length}
        </span>
      </div>

      <div className='space-y-2'>
        {unseatedGuests.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-8'>
            {t("all_seated")}
          </p>
        ) : (
          unseatedGuests.map((guest) => (
            <DraggableGuest
              key={guest.id}
              guest={guest}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableGuest({ guest, t }: { guest: Guest; t: ReturnType<typeof useTranslations> }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `guest-${guest.id}`,
      data: { type: "guest", guest },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg border border-border bg-white shadow-sm cursor-grab active:cursor-grabbing hover:border-primary transition-colors ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className='flex items-center gap-2'>
        <div className='w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs'>
          {guest.first_name[0]}
          {guest.last_name[0]}
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium truncate'>
            {guest.first_name} {guest.last_name}
          </p>
          <p className='text-xs text-muted-foreground truncate'>
            {guest.is_child ? t("child") : guest.relation_type || t("guest")}
          </p>
        </div>
      </div>
    </div>
  );
}

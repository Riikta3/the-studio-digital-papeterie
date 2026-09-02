"use client";

import type { ScheduleEntry, WeddingEvent } from "@shared/types/invitation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScheduleEntryRow } from "./ScheduleEntryRow";

type Props = {
  event: WeddingEvent;
  entries: ScheduleEntry[];
  onChange: (entryId: string, patch: Partial<ScheduleEntry>) => void;
  onMove: (entryId: string, direction: -1 | 1) => void;
  onDelete: (entryId: string) => void;
  onAdd: () => void;
};

export function ScheduleEventGroup({
  event,
  entries,
  onChange,
  onMove,
  onDelete,
  onAdd,
}: Props) {
  const t = useTranslations("InvitationSchedule");
  const sorted = [...entries].sort((a, b) => a.position - b.position);

  return (
    <section className='rounded-xl border border-studio-lavande/40 bg-white p-4'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-heading text-sm text-studio-violet'>{event.name}</h2>
        {!event.enabled && (
          <span className='shrink-0 rounded-full bg-studio-beige/60 px-2.5 py-1 text-xs font-medium text-studio-violet/60'>
            {t("event_disabled")}
          </span>
        )}
      </div>

      {sorted.length > 0 ? (
        <ul className='mt-3 space-y-2'>
          {sorted.map((entry, index) => (
            <ScheduleEntryRow
              key={entry.id}
              entry={entry}
              isFirst={index === 0}
              isLast={index === sorted.length - 1}
              onChange={(patch) => onChange(entry.id, patch)}
              onMoveUp={() => onMove(entry.id, -1)}
              onMoveDown={() => onMove(entry.id, 1)}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
        </ul>
      ) : (
        <p className='mt-3 text-sm text-studio-violet/50'>{t("empty")}</p>
      )}

      <button
        type='button'
        onClick={onAdd}
        className='mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-studio-lavande/60 text-sm font-medium text-studio-violet'
      >
        <Plus className='h-4 w-4' />
        {t("add_entry")}
      </button>
    </section>
  );
}

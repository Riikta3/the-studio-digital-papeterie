"use client";

import type { ScheduleEntry } from "@shared/types/invitation";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  entry: ScheduleEntry;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<ScheduleEntry>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function ScheduleEntryRow({
  entry,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const t = useTranslations("InvitationSchedule");

  return (
    <li className='rounded-lg bg-studio-creme p-3'>
      <div className='flex items-start gap-2'>
        <input
          value={entry.time}
          onChange={(e) => onChange({ time: e.target.value })}
          placeholder={t("time_placeholder")}
          aria-label={t("fields.time")}
          className='min-h-11 w-20 shrink-0 rounded-lg border border-studio-lavande/50 bg-white px-2 text-sm text-studio-violet'
        />
        <div className='min-w-0 flex-1 space-y-2'>
          <input
            value={entry.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={t("title_placeholder")}
            aria-label={t("fields.title")}
            className='min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white px-3 text-sm text-studio-violet'
          />
          <input
            value={entry.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value || undefined })}
            placeholder={t("description_placeholder")}
            aria-label={t("fields.description")}
            className='min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white px-3 text-sm text-studio-violet'
          />
        </div>
      </div>

      <div className='mt-2 flex items-center justify-end gap-1'>
        <button
          type='button'
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={t("move_up")}
          className='flex h-11 w-11 items-center justify-center rounded-lg text-studio-violet/60 disabled:opacity-30'
        >
          ↑
        </button>
        <button
          type='button'
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={t("move_down")}
          className='flex h-11 w-11 items-center justify-center rounded-lg text-studio-violet/60 disabled:opacity-30'
        >
          ↓
        </button>
        <button
          type='button'
          onClick={onDelete}
          aria-label={t("delete_entry", { title: entry.title || t("untitled") })}
          className='flex h-11 w-11 items-center justify-center rounded-lg text-studio-violet/40 hover:text-red-500'
        >
          <Trash2 className='h-4 w-4' />
        </button>
      </div>
    </li>
  );
}

"use client";

import type { FaqEntry } from "@shared/types/invitation";
import { cn } from "@shared/lib/utils";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  entry: FaqEntry;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<FaqEntry>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function FaqRow({
  entry,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const t = useTranslations("InvitationFaq");

  return (
    <li
      className={cn(
        "rounded-xl border p-3",
        entry.published
          ? "border-studio-lavande/40 bg-studio-creme"
          : "border-dashed border-studio-violet/30 bg-white",
      )}
    >
      <div className='flex items-center justify-between gap-2'>
        <span
          className={cn(
            "inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold",
            entry.published
              ? "bg-teal-100 text-teal-700"
              : "bg-studio-jaune/60 text-studio-violet",
          )}
        >
          {entry.published ? t("published") : t("unpublished")}
        </span>
        <label className='flex min-h-11 shrink-0 items-center gap-2 text-xs text-studio-violet/70'>
          {t("published_toggle")}
          <input
            type='checkbox'
            checked={entry.published}
            onChange={(e) => onChange({ published: e.target.checked })}
            className='h-5 w-5 accent-[#4B3F72]'
          />
        </label>
      </div>

      <div className='mt-2 space-y-2'>
        <input
          value={entry.question}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder={t("question_placeholder")}
          aria-label={t("fields.question")}
          className='min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white px-3 text-sm font-medium text-studio-violet'
        />
        <textarea
          value={entry.answer}
          onChange={(e) => onChange({ answer: e.target.value })}
          placeholder={t("answer_placeholder")}
          aria-label={t("fields.answer")}
          rows={3}
          className='min-h-24 w-full resize-none rounded-lg border border-studio-lavande/50 bg-white px-3 py-2 text-sm text-studio-violet'
        />
      </div>

      {!entry.published && (
        <p className='mt-2 text-xs text-studio-violet/60'>{t("unpublished_hint")}</p>
      )}

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
          aria-label={t("delete_entry", { question: entry.question || t("untitled") })}
          className='flex h-11 w-11 items-center justify-center rounded-lg text-studio-violet/40 hover:text-red-500'
        >
          <Trash2 className='h-4 w-4' />
        </button>
      </div>
    </li>
  );
}

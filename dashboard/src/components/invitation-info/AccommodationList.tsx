"use client";

import type { Accommodation } from "@shared/types/invitation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { AccommodationRow } from "./AccommodationRow";

type Props = {
  accommodation: Accommodation[];
  onChangeItem: (id: string, patch: Partial<Accommodation>) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
};

export function AccommodationList({
  accommodation,
  onChangeItem,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAdd,
}: Props) {
  const t = useTranslations("InvitationVenue");
  const sorted = [...accommodation].sort((a, b) => a.position - b.position);

  return (
    <section className='mt-8'>
      <div className='flex items-center justify-between gap-3'>
        <h2 className='font-heading text-h4 text-studio-violet'>
          {t("accommodation.title")}
        </h2>
        <button
          type='button'
          onClick={onAdd}
          className='flex min-h-11 items-center gap-1.5 rounded-full bg-studio-violet px-4 text-sm font-medium text-white'
        >
          <Plus className='h-4 w-4' />
          {t("accommodation.add")}
        </button>
      </div>
      <p className='mt-1 text-xs text-studio-violet/60'>{t("accommodation.hint")}</p>

      {sorted.length === 0 ? (
        <p className='mt-4 rounded-xl border border-dashed border-studio-lavande/50 bg-white p-4 text-center text-sm text-studio-violet/60'>
          {t("accommodation.empty")}
        </p>
      ) : (
        <ul className='mt-4 space-y-3'>
          {sorted.map((item, index) => (
            <AccommodationRow
              key={item.id}
              accommodation={item}
              isFirst={index === 0}
              isLast={index === sorted.length - 1}
              onChange={(patch) => onChangeItem(item.id, patch)}
              onMoveUp={() => onMoveUp(item.id)}
              onMoveDown={() => onMoveDown(item.id)}
              onDelete={() => onDelete(item.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

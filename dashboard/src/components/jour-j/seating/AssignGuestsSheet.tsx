"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  table: DayOfTable;
  candidates: DayOfGuest[];
  seatsLeft: number;
  onConfirm: (guestIds: string[]) => void;
  onClose: () => void;
};

/**
 * Full-screen sheet for seating several guests at once with the thumb.
 * Selection is capped at the table's remaining seats.
 */
export function AssignGuestsSheet({
  table,
  candidates,
  seatsLeft,
  onConfirm,
  onClose,
}: Props) {
  const t = useTranslations("Seating");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const visible = candidates.filter((g) =>
    `${g.firstName} ${g.lastName}`.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < seatsLeft
          ? [...prev, id]
          : prev,
    );

  return (
    <div className='fixed inset-0 z-50 flex flex-col bg-white'>
      <header className='border-b border-studio-lavande/30 px-4 py-3'>
        <div className='flex items-center justify-between'>
          <h2 className='font-heading text-base text-studio-violet'>
            {t("assign_title", { table: table.name })}
          </h2>
          <button
            type='button'
            onClick={onClose}
            aria-label={t("done")}
            className='flex h-11 w-11 items-center justify-center'
          >
            <X className='h-5 w-5 text-studio-violet' />
          </button>
        </div>
        <p className='text-xs text-studio-violet/60'>
          {t("seats_left", { count: seatsLeft - selected.length })}
        </p>
        <input
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          className='mt-2 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
        />
      </header>

      <ul className='flex-1 overflow-y-auto p-2'>
        {visible.map((guest) => {
          const isSelected = selected.includes(guest.id);
          const blocked = !isSelected && selected.length >= seatsLeft;
          return (
            <li key={guest.id}>
              <button
                type='button'
                disabled={blocked}
                onClick={() => toggle(guest.id)}
                className={`flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${
                  isSelected ? "bg-studio-jaune/30" : ""
                } ${blocked ? "opacity-40" : ""}`}
              >
                <span className='text-studio-violet'>
                  {guest.firstName} {guest.lastName}
                </span>
                {isSelected && <Check className='h-4 w-4 text-studio-violet' />}
              </button>
            </li>
          );
        })}
      </ul>

      <footer className='border-t border-studio-lavande/30 p-4'>
        <button
          type='button'
          disabled={selected.length === 0}
          onClick={() => {
            onConfirm(selected);
            onClose();
          }}
          className='min-h-12 w-full rounded-lg bg-studio-violet text-sm font-medium text-white disabled:opacity-40'
        >
          {t("done")} ({selected.length})
        </button>
      </footer>
    </div>
  );
}

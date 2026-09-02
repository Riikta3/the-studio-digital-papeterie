"use client";

import type { DayOfGuest, DayOfTable } from "@shared/types/jour-j";
import { ChevronDown, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssignGuestsSheet } from "./AssignGuestsSheet";

type Props = {
  tables: DayOfTable[];
  guestsById: Map<string, DayOfGuest>;
  unseated: DayOfGuest[];
  onAssign: (guestId: string, tableId: string) => void;
  onUnassign: (guestId: string) => void;
};

/**
 * The mobile seating view. Dragging a guest onto a table with a thumb on a
 * 375px screen doesn't work, so this is tap-to-assign instead — same data,
 * same operations, a different gesture.
 */
export function SeatingList({
  tables,
  guestsById,
  unseated,
  onAssign,
  onUnassign,
}: Props) {
  const t = useTranslations("Seating");
  const [openId, setOpenId] = useState<string | null>(null);
  // Hold the id, not the object: a captured table goes stale the moment
  // someone is seated at it, and the sheet would show the wrong seat count.
  const [sheetTableId, setSheetTableId] = useState<string | null>(null);
  const sheetTable = tables.find((t) => t.id === sheetTableId) ?? null;

  if (tables.length === 0) {
    return (
      <p className='p-8 text-center text-sm text-studio-violet/60'>
        {t("no_tables")}
      </p>
    );
  }

  return (
    <>
      <div className='space-y-2 p-4'>
        {[...tables]
          .sort((a, b) => a.position - b.position)
          .map((table) => {
            const seated = table.guestIds
              .map((id) => guestsById.get(id))
              .filter((g): g is DayOfGuest => Boolean(g));
            const seatsLeft = table.capacity - seated.length;
            const isOpen = openId === table.id;

            return (
              <section
                key={table.id}
                className='overflow-hidden rounded-xl border border-studio-lavande/40 bg-white'
              >
                <button
                  type='button'
                  onClick={() => setOpenId(isOpen ? null : table.id)}
                  aria-expanded={isOpen}
                  className='flex min-h-14 w-full items-center justify-between px-4 text-left'
                >
                  <span>
                    <span className='block font-heading text-sm text-studio-violet'>
                      {table.name}
                    </span>
                    <span className='block text-xs text-studio-violet/60'>
                      {seated.length}/{table.capacity}
                      {table.seatsLabel ? ` · ${table.seatsLabel}` : ""}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-studio-violet/50 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className='border-t border-studio-lavande/30 px-2 pb-2'>
                    <ul>
                      {seated.map((guest) => (
                        <li
                          key={guest.id}
                          className='flex min-h-12 items-center justify-between px-2 text-sm text-studio-violet'
                        >
                          <span className='truncate'>
                            {guest.firstName} {guest.lastName}
                          </span>
                          <button
                            type='button'
                            onClick={() => onUnassign(guest.id)}
                            aria-label={t("remove")}
                            className='flex h-11 w-11 shrink-0 items-center justify-center'
                          >
                            <X className='h-4 w-4 text-studio-violet/50' />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type='button'
                      disabled={seatsLeft === 0}
                      onClick={() => setSheetTableId(table.id)}
                      className='mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-studio-creme text-sm text-studio-violet disabled:opacity-40'
                    >
                      <UserPlus className='h-4 w-4' />
                      {seatsLeft === 0 ? t("table_full") : t("assign")}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
      </div>

      {sheetTable && (
        <AssignGuestsSheet
          table={sheetTable}
          candidates={unseated}
          seatsLeft={sheetTable.capacity - sheetTable.guestIds.length}
          onConfirm={(ids) => ids.forEach((id) => onAssign(id, sheetTable.id))}
          onClose={() => setSheetTableId(null)}
        />
      )}
    </>
  );
}

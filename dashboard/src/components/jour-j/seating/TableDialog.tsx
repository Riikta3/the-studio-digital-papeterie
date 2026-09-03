"use client";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import type { DayOfTable } from "@shared/types/jour-j";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The table being edited, or undefined when adding a new one. */
  table?: DayOfTable;
  /** How many people are already seated — the floor for capacity when editing. */
  seatedCount?: number;
  onSubmit: (values: {
    name: string;
    capacity: number;
    seatsLabel?: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
};

/**
 * Adds or edits one table.
 *
 * A dialog rather than inline fields on the card: the card is a drop target
 * that already holds twelve names, and putting editable inputs inside it makes
 * dragging onto it unreliable — a pointer-down on a text field is not a drop.
 */
export function TableDialog({
  open,
  onOpenChange,
  table,
  seatedCount = 0,
  onSubmit,
  onDelete,
}: Props) {
  const t = useTranslations("Seating");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [seatsLabel, setSeatsLabel] = useState("");
  const [busy, setBusy] = useState(false);

  // Re-seed the fields whenever the dialog opens on a different table —
  // otherwise it keeps whatever the previous table's values were.
  useEffect(() => {
    if (!open) return;
    setName(table?.name ?? "");
    setCapacity(String(table?.capacity ?? 8));
    setSeatsLabel(table?.seatsLabel ?? "");
  }, [open, table]);

  const parsedCapacity = Number.parseInt(capacity, 10);
  const capacityTooSmall =
    Number.isFinite(parsedCapacity) && parsedCapacity < seatedCount;
  const canSubmit =
    name.trim().length > 0 &&
    Number.isInteger(parsedCapacity) &&
    parsedCapacity >= 1 &&
    !capacityTooSmall &&
    !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    await onSubmit({
      name: name.trim(),
      capacity: parsedCapacity,
      seatsLabel: seatsLabel.trim() || undefined,
    });
    setBusy(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-white sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='font-heading text-studio-violet'>
            {table ? t("edit_table") : t("add_table")}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='table-name' className='text-studio-violet'>
              {t("table_name")}
            </Label>
            <Input
              id='table-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("table_name_placeholder")}
              className='min-h-11'
              autoFocus
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='table-capacity' className='text-studio-violet'>
              {t("table_capacity")}
            </Label>
            <Input
              id='table-capacity'
              type='number'
              inputMode='numeric'
              min={Math.max(1, seatedCount)}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className='min-h-11'
            />
            {capacityTooSmall && (
              <p className='text-xs text-red-600'>
                {t("capacity_below_seated", { count: seatedCount })}
              </p>
            )}
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='table-label' className='text-studio-violet'>
              {t("table_seats_label")}
            </Label>
            <Input
              id='table-label'
              value={seatsLabel}
              onChange={(e) => setSeatsLabel(e.target.value)}
              placeholder={t("table_seats_label_placeholder")}
              className='min-h-11'
            />
          </div>
        </div>

        <DialogFooter className='gap-2 sm:justify-between'>
          {table && onDelete ? (
            <Button
              type='button'
              onClick={async () => {
                setBusy(true);
                await onDelete();
                setBusy(false);
                onOpenChange(false);
              }}
              disabled={busy}
              className='min-h-11 bg-red-500 text-white hover:bg-red-600'
            >
              {t("delete_table")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type='button'
            onClick={submit}
            disabled={!canSubmit}
            className='min-h-11'
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

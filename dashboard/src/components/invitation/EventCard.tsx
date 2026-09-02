"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import type { WeddingEvent } from "@shared/types/invitation";
import { ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  event: WeddingEvent;
  onChange: (patch: Partial<WeddingEvent>) => void;
  onDelete: () => void;
};

export function EventCard({ event, onChange, onDelete }: Props) {
  const t = useTranslations("InvitationEvents");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    // The handle is a separate control from the card, so dnd-kit needs it
    // registered as the activator — otherwise the listeners fire on an
    // element it does not recognise and no drag ever starts.
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const formattedDate = event.date
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${event.date}T00:00:00`))
    : null;

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-2xl border bg-white shadow-studio-card",
        event.enabled
          ? "border-studio-lavande/40"
          : "border-studio-lavande/20 opacity-60",
        // Lift the card being dragged above its neighbours.
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <div className='flex min-h-14 items-center gap-1 px-2 py-3'>
        {/* The drag handle is its own control: dragging the whole header would
            fight the expand toggle. */}
        <button
          type='button'
          ref={setActivatorNodeRef}
          aria-label={t("reorder")}
          className='flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-studio-violet/40 hover:text-studio-violet active:cursor-grabbing'
          {...attributes}
          {...listeners}
        >
          <GripVertical className='h-4 w-4' />
        </button>

        <button
          type='button'
          onClick={() => setExpanded((v) => !v)}
          className='flex min-h-11 flex-1 items-center justify-between gap-3 pr-2 text-left'
        >
          <div className='min-w-0 flex-1'>
            <h2 className='truncate font-heading text-sm text-studio-violet'>
              {event.name || t("untitled")}
            </h2>
            <p className='mt-0.5 truncate text-xs text-studio-violet/60'>
              {formattedDate ?? t("no_date")}
              {event.time ? ` · ${event.time}` : ""}
            </p>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-studio-violet/50 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
      </div>

      {expanded && (
        <div className='space-y-4 border-t border-studio-lavande/20 px-4 py-4'>
          <label className='block'>
            <span className='text-xs font-medium text-studio-violet/70'>
              {t("fields.name")}
            </span>
            <input
              value={event.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
            />
          </label>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <label className='block'>
              <span className='text-xs font-medium text-studio-violet/70'>
                {t("fields.date")}
              </span>
              <input
                type='date'
                value={event.date ?? ""}
                onChange={(e) => onChange({ date: e.target.value || undefined })}
                className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
              />
            </label>
            <label className='block'>
              <span className='text-xs font-medium text-studio-violet/70'>
                {t("fields.time")}
              </span>
              <input
                value={event.time ?? ""}
                onChange={(e) => onChange({ time: e.target.value || undefined })}
                placeholder={t("fields.time_placeholder")}
                className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
              />
            </label>
          </div>

          <label className='block'>
            <span className='text-xs font-medium text-studio-violet/70'>
              {t("fields.address")}
            </span>
            <input
              value={event.address ?? ""}
              onChange={(e) => onChange({ address: e.target.value || undefined })}
              className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
            />
          </label>

          <label className='block'>
            <span className='text-xs font-medium text-studio-violet/70'>
              {t("fields.description")}
            </span>
            <textarea
              value={event.description ?? ""}
              onChange={(e) =>
                onChange({ description: e.target.value || undefined })
              }
              rows={3}
              className='mt-1 w-full rounded-lg border border-studio-lavande/50 px-3 py-2 text-sm text-studio-violet'
            />
          </label>

          <label className='block'>
            <span className='text-xs font-medium text-studio-violet/70'>
              {t("fields.dress_code")}
            </span>
            <input
              value={event.dressCode ?? ""}
              onChange={(e) => onChange({ dressCode: e.target.value || undefined })}
              className='mt-1 min-h-11 w-full rounded-lg border border-studio-lavande/50 px-3 text-sm text-studio-violet'
            />
          </label>

          <div className='flex flex-wrap items-center justify-between gap-3 border-t border-studio-lavande/20 pt-3'>
            <label className='flex min-h-11 items-center gap-2 text-sm text-studio-violet'>
              <input
                type='checkbox'
                checked={event.enabled}
                onChange={(e) => onChange({ enabled: e.target.checked })}
                className='h-4 w-4 accent-[#4B3F72]'
              />
              {t("enabled")}
            </label>

            {/* Reordering lives on the drag handle in the header. */}
            <button
              type='button'
              onClick={() => setConfirmOpen(true)}
              aria-label={t("delete")}
              className='flex h-11 w-11 items-center justify-center rounded-lg text-studio-violet/40 hover:text-red-500'
            >
              <Trash2 className='h-4 w-4' />
            </button>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete_dialog.title", { name: event.name })}</DialogTitle>
            <DialogDescription>{t("delete_dialog.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button variant='outline' onClick={() => setConfirmOpen(false)}>
              {t("delete_dialog.cancel")}
            </Button>
            <Button
              className='bg-red-500 hover:bg-red-600 text-white'
              onClick={() => {
                onDelete();
                setConfirmOpen(false);
              }}
            >
              {t("delete_dialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

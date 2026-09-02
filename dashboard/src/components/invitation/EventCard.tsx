"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import type { GuestEventStatus, WeddingEvent } from "@shared/types/invitation";
import { CheckCircle, ChevronDown, Clock, Trash2, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  event: WeddingEvent;
  guestEvents: GuestEventStatus[];
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<WeddingEvent>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function EventCard({
  event,
  guestEvents,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const t = useTranslations("InvitationEvents");
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const counts = guestEvents.reduce(
    (acc, g) => {
      if (g.eventId === event.id) acc[g.status] += 1;
      return acc;
    },
    { confirmed: 0, pending: 0, declined: 0 },
  );

  const formattedDate = event.date
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${event.date}T00:00:00`))
    : null;

  return (
    <section
      className={cn(
        "rounded-2xl border bg-white shadow-studio-card transition-opacity",
        event.enabled
          ? "border-studio-lavande/40"
          : "border-studio-lavande/20 opacity-60",
      )}
    >
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left'
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

      {/* Per-event attendance — the number the couple actually cares about. */}
      <div className='flex flex-wrap gap-2 px-4 pb-3'>
        <span className='inline-flex min-h-8 items-center gap-1.5 rounded-full bg-teal-50 px-2.5 text-xs font-medium text-teal-700'>
          <CheckCircle className='h-3.5 w-3.5' />
          {t("counts.confirmed", { count: counts.confirmed })}
        </span>
        <span className='inline-flex min-h-8 items-center gap-1.5 rounded-full bg-studio-jaune/20 px-2.5 text-xs font-medium text-studio-pourpre'>
          <Clock className='h-3.5 w-3.5' />
          {t("counts.pending", { count: counts.pending })}
        </span>
        <span className='inline-flex min-h-8 items-center gap-1.5 rounded-full bg-red-50 px-2.5 text-xs font-medium text-red-700'>
          <XCircle className='h-3.5 w-3.5' />
          {t("counts.declined", { count: counts.declined })}
        </span>
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

            <div className='flex items-center gap-1'>
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
                onClick={() => setConfirmOpen(true)}
                aria-label={t("delete")}
                className='flex h-11 w-11 items-center justify-center rounded-lg text-studio-violet/40 hover:text-red-500'
              >
                <Trash2 className='h-4 w-4' />
              </button>
            </div>
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

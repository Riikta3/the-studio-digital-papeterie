"use client";

import type { ScheduleEntry, WeddingEvent } from "@shared/types/invitation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  createScheduleEntry,
  deleteScheduleEntry,
  reorderScheduleEntries,
  updateScheduleEntry,
} from "@/actions/schedule-actions";
import { ScheduleEventGroup } from "./ScheduleEventGroup";

type Props = {
  events: WeddingEvent[];
  initialSchedule: ScheduleEntry[];
};

export function ScheduleEditor({ events, initialSchedule }: Props) {
  const t = useTranslations("InvitationSchedule");
  const [schedule, setSchedule] = useState(initialSchedule);
  const sortedEvents = [...events].sort((a, b) => a.position - b.position);

  const update = async (entryId: string, patch: Partial<ScheduleEntry>) => {
    const previous = schedule; // capture BEFORE mutating, for rollback
    setSchedule((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
    );
    const res = await updateScheduleEntry(entryId, patch);
    if (!res.success) {
      setSchedule(previous);
      toast.error(res.error || t("save_failed"));
    }
  };

  const remove = async (entryId: string) => {
    const previous = schedule;
    const entry = previous.find((e) => e.id === entryId);
    setSchedule((prev) => prev.filter((e) => e.id !== entryId));
    const res = await deleteScheduleEntry(entryId);
    if (!res.success) {
      setSchedule(previous);
      toast.error(res.error || t("save_failed"));
      return;
    }
    // No confirmation dialog for a programme entry — it's cheap to retype —
    // but the couple should still see exactly what just disappeared.
    if (entry) {
      toast.success(
        t("deleted_toast", { title: entry.title || t("untitled") }),
      );
    }
  };

  const move = async (entryId: string, direction: -1 | 1) => {
    const previous = schedule;
    const entry = previous.find((e) => e.id === entryId);
    if (!entry) return;
    // Reorder within this entry's own event only — a brunch entry must
    // never swap positions with a ceremony entry from another event.
    const siblings = previous
      .filter((e) => e.eventId === entry.eventId)
      .sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((e) => e.id === entryId);
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
    const reordered = siblings.map((e, i) => ({ ...e, position: i }));
    const byId = new Map(reordered.map((e) => [e.id, e]));
    const next = previous.map((e) => byId.get(e.id) ?? e);
    setSchedule(next);

    const res = await reorderScheduleEntries(reordered.map((e) => e.id));
    if (!res.success) {
      setSchedule(previous);
      toast.error(res.error || t("save_failed"));
    }
  };

  const addEntry = async (eventId: string) => {
    const count = schedule.filter((e) => e.eventId === eventId).length;
    const res = await createScheduleEntry({
      eventId,
      time: "",
      title: t("new_entry_title"),
      position: count,
    });
    if (!res.success) {
      toast.error(res.error || t("save_failed"));
      return;
    }
    // Adopt the database's id — a client-generated one is not a valid uuid,
    // and every later update would target a row that does not exist.
    setSchedule((prev) => [...prev, res.entry]);
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        <div className='mt-6 space-y-3'>
          {sortedEvents.map((event) => (
            <ScheduleEventGroup
              key={event.id}
              event={event}
              entries={schedule.filter((e) => e.eventId === event.id)}
              onChange={update}
              onMove={move}
              onDelete={remove}
              onAdd={() => addEntry(event.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

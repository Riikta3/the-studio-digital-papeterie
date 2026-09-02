"use client";

import type { ScheduleEntry, WeddingEvent } from "@shared/types/invitation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { ScheduleEventGroup } from "./ScheduleEventGroup";

type Props = {
  events: WeddingEvent[];
  initialSchedule: ScheduleEntry[];
};

export function ScheduleEditor({ events, initialSchedule }: Props) {
  const t = useTranslations("InvitationSchedule");
  const [schedule, setSchedule] = useState(initialSchedule);
  const sortedEvents = [...events].sort((a, b) => a.position - b.position);

  const update = (entryId: string, patch: Partial<ScheduleEntry>) =>
    setSchedule((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
    );

  const remove = (entryId: string) => {
    const entry = schedule.find((e) => e.id === entryId);
    setSchedule((prev) => prev.filter((e) => e.id !== entryId));
    // No confirmation dialog for a programme entry — it's cheap to retype —
    // but the couple should still see exactly what just disappeared.
    if (entry) {
      toast.success(
        t("deleted_toast", { title: entry.title || t("untitled") }),
      );
    }
  };

  const move = (entryId: string, direction: -1 | 1) =>
    setSchedule((prev) => {
      const entry = prev.find((e) => e.id === entryId);
      if (!entry) return prev;
      // Reorder within this entry's own event only — a brunch entry must
      // never swap positions with a ceremony entry from another event.
      const siblings = prev
        .filter((e) => e.eventId === entry.eventId)
        .sort((a, b) => a.position - b.position);
      const index = siblings.findIndex((e) => e.id === entryId);
      const target = index + direction;
      if (target < 0 || target >= siblings.length) return prev;
      [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
      const reordered = siblings.map((e, i) => ({ ...e, position: i }));
      const byId = new Map(reordered.map((e) => [e.id, e]));
      return prev.map((e) => byId.get(e.id) ?? e);
    });

  const addEntry = (eventId: string) => {
    const count = schedule.filter((e) => e.eventId === eventId).length;
    const newEntry: ScheduleEntry = {
      id: `sc-${crypto.randomUUID()}`,
      eventId,
      time: "",
      title: t("new_entry_title"),
      position: count,
    };
    setSchedule((prev) => [...prev, newEntry]);
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

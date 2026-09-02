"use client";

import { Button } from "@shared/components/ui/button";
import type { GuestEventStatus, WeddingEvent } from "@shared/types/invitation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EventCard } from "./EventCard";

type Props = {
  initialEvents: WeddingEvent[];
  guestEvents: GuestEventStatus[];
};

export function EventsEditor({ initialEvents, guestEvents }: Props) {
  const t = useTranslations("InvitationEvents");
  const [events, setEvents] = useState(
    [...initialEvents].sort((a, b) => a.position - b.position),
  );

  const update = (id: string, patch: Partial<WeddingEvent>) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const remove = (id: string) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  const move = (id: string, direction: -1 | 1) =>
    setEvents((prev) => {
      const index = prev.findIndex((e) => e.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((e, i) => ({ ...e, position: i }));
    });

  const addEvent = () => {
    const newEvent: WeddingEvent = {
      id: `ev-${crypto.randomUUID()}`,
      key: "party",
      name: t("new_event_name"),
      position: events.length,
      enabled: true,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        <div className='mt-6 space-y-3'>
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              guestEvents={guestEvents}
              isFirst={index === 0}
              isLast={index === events.length - 1}
              onChange={(patch) => update(event.id, patch)}
              onMoveUp={() => move(event.id, -1)}
              onMoveDown={() => move(event.id, 1)}
              onDelete={() => remove(event.id)}
            />
          ))}
        </div>

        <Button
          type='button'
          variant='outline'
          onClick={addEvent}
          className='mt-4 flex min-h-12 w-full items-center justify-center gap-2 border-studio-lavande/50 text-studio-violet'
        >
          <Plus className='h-4 w-4' />
          {t("add_event")}
        </Button>
      </div>
    </div>
  );
}

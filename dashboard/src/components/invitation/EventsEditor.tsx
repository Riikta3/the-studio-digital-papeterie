"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@shared/components/ui/button";
import type { WeddingEvent } from "@shared/types/invitation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EventCard } from "./EventCard";

type Props = {
  initialEvents: WeddingEvent[];
};

export function EventsEditor({ initialEvents }: Props) {
  const t = useTranslations("InvitationEvents");
  const [events, setEvents] = useState(
    [...initialEvents].sort((a, b) => a.position - b.position),
  );

  // PointerSensor covers mouse, touch and pen in one, matching the module
  // list's sortable elsewhere in this dashboard. 8px of travel keeps a tap on
  // the handle from starting a drag; the keyboard sensor makes reordering
  // reachable without a pointer at all.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const update = (id: string, patch: Partial<WeddingEvent>) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const remove = (id: string) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setEvents((prev) => {
      const from = prev.findIndex((e) => e.id === active.id);
      const to = prev.findIndex((e) => e.id === over.id);
      if (from < 0 || to < 0) return prev;
      // Renumber after the move so `position` stays the stored order.
      return arrayMove(prev, from, to).map((e, i) => ({ ...e, position: i }));
    });
  };

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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={events.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className='mt-6 space-y-3'>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onChange={(patch) => update(event.id, patch)}
                  onDelete={() => remove(event.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

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

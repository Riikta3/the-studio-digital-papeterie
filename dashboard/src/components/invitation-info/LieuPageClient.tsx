"use client";

import type { Accommodation, Venue } from "@shared/types/invitation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AccommodationList } from "./AccommodationList";
import { VenueForm } from "./VenueForm";

type Props = {
  initialVenue: Venue;
  initialAccommodation: Accommodation[];
};

export function LieuPageClient({ initialVenue, initialAccommodation }: Props) {
  const t = useTranslations("InvitationVenue");
  const [venue, setVenue] = useState(initialVenue);
  const [accommodation, setAccommodation] = useState(initialAccommodation);

  const updateVenue = (patch: Partial<Venue>) =>
    setVenue((prev) => ({ ...prev, ...patch }));

  const updateItem = (id: string, patch: Partial<Accommodation>) =>
    setAccommodation((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const swapPositions = (id: string, direction: -1 | 1) =>
    setAccommodation((prev) => {
      const sorted = [...prev].sort((a, b) => a.position - b.position);
      const index = sorted.findIndex((item) => item.id === id);
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= sorted.length) return prev;

      const positions = sorted.map((item) => item.position);
      sorted[index] = { ...sorted[index], position: positions[targetIndex] };
      sorted[targetIndex] = { ...sorted[targetIndex], position: positions[index] };
      return sorted;
    });

  const deleteItem = (id: string) =>
    setAccommodation((prev) => prev.filter((item) => item.id !== id));

  const addItem = () =>
    setAccommodation((prev) => [
      ...prev,
      {
        id: `ac-${crypto.randomUUID()}`,
        name: "",
        position: prev.length,
      },
    ]);

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        <div className='mt-6'>
          <VenueForm venue={venue} onChange={updateVenue} />
        </div>

        <AccommodationList
          accommodation={accommodation}
          onChangeItem={updateItem}
          onMoveUp={(id) => swapPositions(id, -1)}
          onMoveDown={(id) => swapPositions(id, 1)}
          onDelete={deleteItem}
          onAdd={addItem}
        />
      </div>
    </div>
  );
}

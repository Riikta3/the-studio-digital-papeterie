"use client";

import type { Accommodation, Venue } from "@shared/types/invitation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  createAccommodation,
  deleteAccommodation,
  reorderAccommodations,
  updateAccommodation,
  upsertVenue,
} from "@/actions/venue-actions";
import { AccommodationList } from "./AccommodationList";
import { VenueForm } from "./VenueForm";

type Props = {
  /** `null` when the couple has never opened this screen — `venues` has no row yet. */
  initialVenue: Venue | null;
  initialAccommodation: Accommodation[];
};

const EMPTY_VENUE: Venue = { name: "" };

export function LieuPageClient({ initialVenue, initialAccommodation }: Props) {
  const t = useTranslations("InvitationVenue");
  // Independent state per concern (venue / accommodation list): a failed
  // accommodation insert must not roll back the couple's unsaved venue text.
  const [venue, setVenue] = useState(initialVenue ?? EMPTY_VENUE);
  const [accommodation, setAccommodation] = useState(initialAccommodation);

  const updateVenue = (patch: Partial<Venue>) => {
    const previous = venue; // capture BEFORE mutating, for rollback
    setVenue((prev) => ({ ...prev, ...patch }));
    void upsertVenue(patch).then((res) => {
      if (!res.success) {
        setVenue(previous);
        toast.error(res.error || t("save_failed"));
      }
    });
  };

  const updateItem = async (id: string, patch: Partial<Accommodation>) => {
    const previous = accommodation;
    setAccommodation((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    const res = await updateAccommodation(id, patch);
    if (!res.success) {
      setAccommodation(previous);
      toast.error(res.error || t("save_failed"));
    }
  };

  const swapPositions = (id: string, direction: -1 | 1) => {
    const previous = accommodation;
    const sorted = [...previous].sort((a, b) => a.position - b.position);
    const index = sorted.findIndex((item) => item.id === id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const positions = sorted.map((item) => item.position);
    sorted[index] = { ...sorted[index], position: positions[targetIndex] };
    sorted[targetIndex] = { ...sorted[targetIndex], position: positions[index] };
    setAccommodation(sorted);

    void reorderAccommodations(sorted.map((item) => item.id)).then((res) => {
      if (!res.success) {
        setAccommodation(previous);
        toast.error(res.error || t("save_failed"));
      }
    });
  };

  const deleteItem = async (id: string) => {
    const previous = accommodation;
    setAccommodation((prev) => prev.filter((item) => item.id !== id));
    const res = await deleteAccommodation(id);
    if (!res.success) {
      setAccommodation(previous);
      toast.error(res.error || t("save_failed"));
    }
  };

  const addItem = async () => {
    const res = await createAccommodation({
      name: "",
      position: accommodation.length,
    });
    if (!res.success) {
      toast.error(res.error || t("save_failed"));
      return;
    }
    // Adopt the database's id — a client-generated one is not a valid uuid,
    // and every later update would target a row that does not exist.
    setAccommodation((prev) => [...prev, res.accommodation]);
  };

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
          onChangeItem={(id, patch) => void updateItem(id, patch)}
          onMoveUp={(id) => swapPositions(id, -1)}
          onMoveDown={(id) => swapPositions(id, 1)}
          onDelete={(id) => void deleteItem(id)}
          onAdd={() => void addItem()}
        />
      </div>
    </div>
  );
}

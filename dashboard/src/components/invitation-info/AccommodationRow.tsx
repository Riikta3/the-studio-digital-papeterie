"use client";

import type { Accommodation } from "@shared/types/invitation";
import { ExternalLink, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { PhotoPicker } from "./PhotoPicker";

type Props = {
  accommodation: Accommodation;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<Accommodation>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

const inputClass =
  "min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-studio-creme px-3 text-sm text-studio-violet";

export function AccommodationRow({
  accommodation,
  isFirst,
  isLast,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  const t = useTranslations("InvitationVenue");

  return (
    /* White, not cream: the page behind is already cream, so a cream card
       reads as a transparent hole rather than a surface. */
    <li className='rounded-xl border border-studio-lavande/40 bg-white p-3 shadow-studio-card'>
      {/* A thumbnail rather than a full-width picker: an accommodation row is
          a list item, and the venue's own photo is the one that leads. */}
      <PhotoPicker
        value={accommodation.photoUrl}
        onChange={(photoUrl) => onChange({ photoUrl })}
        aspect='square'
        // 32 rather than 24: the remove button holds the 44px tap floor, and
        // on a 96px thumbnail that covered a fifth of the image.
        className='mb-2 w-32'
      />

      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        <input
          value={accommodation.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t("accommodation.name_placeholder")}
          aria-label={t("accommodation.fields.name")}
          className={inputClass}
        />
        <input
          value={accommodation.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value || undefined })}
          placeholder={t("accommodation.city_placeholder")}
          aria-label={t("accommodation.fields.city")}
          className={inputClass}
        />
        <input
          value={accommodation.distance ?? ""}
          onChange={(e) => onChange({ distance: e.target.value || undefined })}
          placeholder={t("accommodation.distance_placeholder")}
          aria-label={t("accommodation.fields.distance")}
          className={inputClass}
        />
        <input
          value={accommodation.phone ?? ""}
          onChange={(e) => onChange({ phone: e.target.value || undefined })}
          placeholder={t("accommodation.phone_placeholder")}
          aria-label={t("accommodation.fields.phone")}
          className={inputClass}
        />
        <div className='flex gap-2 sm:col-span-2'>
          <input
            value={accommodation.bookingUrl ?? ""}
            onChange={(e) => onChange({ bookingUrl: e.target.value || undefined })}
            placeholder={t("accommodation.booking_url_placeholder")}
            aria-label={t("accommodation.fields.booking_url")}
            className={inputClass}
          />
          {accommodation.bookingUrl && (
            <a
              href={accommodation.bookingUrl}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={t("accommodation.open_booking")}
              className='flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-studio-lavande/50 bg-white text-studio-violet hover:bg-studio-lavande/10'
            >
              <ExternalLink className='h-4 w-4' />
            </a>
          )}
        </div>
        <input
          value={accommodation.offer ?? ""}
          onChange={(e) => onChange({ offer: e.target.value || undefined })}
          placeholder={t("accommodation.offer_placeholder")}
          aria-label={t("accommodation.fields.offer")}
          className={`${inputClass} sm:col-span-2`}
        />
      </div>

      <div className='mt-2 flex items-center justify-end gap-1'>
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
          onClick={onDelete}
          aria-label={t("accommodation.delete", { name: accommodation.name || t("accommodation.untitled") })}
          className='flex h-11 w-11 items-center justify-center rounded-lg text-studio-violet/40 hover:text-red-500'
        >
          <Trash2 className='h-4 w-4' />
        </button>
      </div>
    </li>
  );
}

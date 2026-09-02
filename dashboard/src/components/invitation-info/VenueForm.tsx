"use client";

import type { Venue } from "@shared/types/invitation";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { PhotoPicker } from "./PhotoPicker";

type Props = {
  venue: Venue;
  onChange: (patch: Partial<Venue>) => void;
};

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className='flex flex-col gap-1 border-b border-studio-lavande/30 py-3 last:border-0'>
      <span className='text-sm font-medium text-studio-violet'>{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "min-h-11 w-full rounded-lg border border-studio-lavande/50 bg-white px-3 text-sm text-studio-violet";

export function VenueForm({ venue, onChange }: Props) {
  const t = useTranslations("InvitationVenue");

  return (
    <section className='rounded-2xl border border-studio-lavande/40 bg-white px-4 shadow-studio-card'>
      {/* The photo leads: it is what a guest sees first on the invitation. */}
      <div className='border-b border-studio-lavande/30 py-3'>
        <span className='text-sm font-medium text-studio-violet'>
          {t("fields.photo")}
        </span>
        <PhotoPicker
          value={venue.photoUrl}
          onChange={(photoUrl) => onChange({ photoUrl })}
          className='mt-1.5'
        />
      </div>

      <FormRow label={t("fields.name")}>
        <input
          value={venue.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder={t("fields.name_placeholder")}
          className={inputClass}
        />
      </FormRow>

      <FormRow label={t("fields.address")}>
        <input
          value={venue.address ?? ""}
          onChange={(e) => onChange({ address: e.target.value || undefined })}
          placeholder={t("fields.address_placeholder")}
          className={inputClass}
        />
      </FormRow>

      <FormRow label={t("fields.city")}>
        <input
          value={venue.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value || undefined })}
          placeholder={t("fields.city_placeholder")}
          className={inputClass}
        />
      </FormRow>

      <FormRow label={t("fields.maps_url")}>
        <div className='flex gap-2'>
          <input
            value={venue.mapsUrl ?? ""}
            onChange={(e) => onChange({ mapsUrl: e.target.value || undefined })}
            placeholder={t("fields.maps_url_placeholder")}
            className={inputClass}
          />
          {venue.mapsUrl && (
            <a
              href={venue.mapsUrl}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={t("open_maps")}
              className='flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-studio-lavande/50 text-studio-violet hover:bg-studio-creme'
            >
              <ExternalLink className='h-4 w-4' />
            </a>
          )}
        </div>
      </FormRow>

      <FormRow label={t("fields.waze_url")}>
        <div className='flex gap-2'>
          <input
            value={venue.wazeUrl ?? ""}
            onChange={(e) => onChange({ wazeUrl: e.target.value || undefined })}
            placeholder={t("fields.waze_url_placeholder")}
            className={inputClass}
          />
          {venue.wazeUrl && (
            <a
              href={venue.wazeUrl}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={t("open_waze")}
              className='flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-studio-lavande/50 text-studio-violet hover:bg-studio-creme'
            >
              <ExternalLink className='h-4 w-4' />
            </a>
          )}
        </div>
      </FormRow>

      <FormRow label={t("fields.parking_info")}>
        <textarea
          value={venue.parkingInfo ?? ""}
          onChange={(e) => onChange({ parkingInfo: e.target.value || undefined })}
          placeholder={t("fields.parking_info_placeholder")}
          rows={3}
          className='min-h-24 w-full resize-none rounded-lg border border-studio-lavande/50 bg-white px-3 py-2 text-sm text-studio-violet'
        />
      </FormRow>

      <FormRow label={t("fields.access_info")}>
        <textarea
          value={venue.accessInfo ?? ""}
          onChange={(e) => onChange({ accessInfo: e.target.value || undefined })}
          placeholder={t("fields.access_info_placeholder")}
          rows={3}
          className='min-h-24 w-full resize-none rounded-lg border border-studio-lavande/50 bg-white px-3 py-2 text-sm text-studio-violet'
        />
      </FormRow>

      <FormRow label={t("fields.transport_info")}>
        <textarea
          value={venue.transportInfo ?? ""}
          onChange={(e) => onChange({ transportInfo: e.target.value || undefined })}
          placeholder={t("fields.transport_info_placeholder")}
          rows={3}
          className='min-h-24 w-full resize-none rounded-lg border border-studio-lavande/50 bg-white px-3 py-2 text-sm text-studio-violet'
        />
      </FormRow>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { ImageField } from "../fields/ImageField";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import type { EditorVenue } from "../types";
import { FormLayout } from "./shared";

/**
 * The venue: where it is, its links, its photo, a few words about it, and how
 * to get there.
 *
 * Everything but the presentation lives in `venues`; the presentation is the
 * map module's `description`, which is where the invitation has always read it
 * from. The travel notes are one directive per line: each field becomes one
 * heading ("Transports", "Stationnement", "Accès") with its lines under it.
 */
export function VenueForm() {
  const t = useTranslations("Editor");
  const { draft, update, updateModule } = useEditor();

  const set = (patch: Partial<EditorVenue>) => update("venue", (venue) => ({ ...venue, ...patch }));
  const intro = draft.modules.map?.description;

  return (
    <FormLayout>
      <SectionIntro section="map" />

      <FieldGroup title={t("groups.venue")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("fields.venueName")}
            value={draft.venue.name}
            onChange={(name) => set({ name })}
            maxLength={160}
          />
          <TextField
            label={t("fields.venueCity")}
            value={draft.venue.city}
            onChange={(city) => set({ city })}
            maxLength={120}
          />
        </div>
        <TextField
          label={t("fields.venueAddress")}
          value={draft.venue.address}
          onChange={(address) => set({ address })}
          multiline
          rows={2}
          maxLength={400}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("fields.mapsUrl")}
            value={draft.venue.mapsUrl}
            onChange={(mapsUrl) => set({ mapsUrl })}
            type="url"
            inputMode="url"
            placeholder={t("placeholders.url")}
            maxLength={2000}
          />
          <TextField
            label={t("fields.wazeUrl")}
            value={draft.venue.wazeUrl}
            onChange={(wazeUrl) => set({ wazeUrl })}
            type="url"
            inputMode="url"
            placeholder={t("placeholders.url")}
            maxLength={2000}
          />
        </div>
        <p className="text-[11px] leading-snug text-studio-violet/55">{t("hints.links")}</p>
        <ImageField
          label={t("fields.venuePhoto")}
          value={draft.venue.photoUrl}
          onChange={(photoUrl) => set({ photoUrl })}
          folder="venue"
        />
      </FieldGroup>

      <FieldGroup title={t("groups.venueIntro")}>
        <TextField
          label={t("fields.venueIntro")}
          value={typeof intro === "string" ? intro : ""}
          onChange={(description) => updateModule("map", (config) => ({ ...config, description }))}
          placeholder={t("placeholders.venueIntro")}
          multiline
          rows={3}
          maxLength={2000}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.access")} description={t("groups.accessDescription")}>
        <TextField
          label={t("fields.transportInfo")}
          value={draft.venue.transportInfo}
          onChange={(transportInfo) => set({ transportInfo })}
          multiline
          rows={3}
          maxLength={1500}
        />
        <TextField
          label={t("fields.parkingInfo")}
          value={draft.venue.parkingInfo}
          onChange={(parkingInfo) => set({ parkingInfo })}
          multiline
          rows={2}
          maxLength={1500}
        />
        <TextField
          label={t("fields.accessInfo")}
          value={draft.venue.accessInfo}
          onChange={(accessInfo) => set({ accessInfo })}
          multiline
          rows={2}
          maxLength={1500}
        />
      </FieldGroup>

      <SlotFields section="map" />
    </FormLayout>
  );
}

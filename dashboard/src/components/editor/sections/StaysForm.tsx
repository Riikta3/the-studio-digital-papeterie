"use client";

import { useTranslations } from "next-intl";

import { newId, useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { ImageField } from "../fields/ImageField";
import { ListEditor } from "../fields/ListEditor";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { ToggleField } from "../fields/ToggleField";
import type { EditorAccommodation } from "../types";
import { FormLayout } from "./shared";

/**
 * Where guests can sleep. Hotels flagged "plus d'options" go behind the
 * theme's "voir plus d'options" toggle, so a long list stays a short page.
 *
 * The intro is the accommodation module's `description` — some themes print
 * it as a paragraph, "Ciao Amore" as the small line above the title.
 */
export function StaysForm() {
  const t = useTranslations("Editor");
  const { draft, update, updateModule } = useEditor();
  const intro = draft.modules.accommodation?.description;

  return (
    <FormLayout>
      <SectionIntro section="accommodation" />

      <FieldGroup title={t("groups.staysIntro")}>
        <TextField
          label={t("fields.staysIntro")}
          value={typeof intro === "string" ? intro : ""}
          onChange={(description) =>
            updateModule("accommodation", (config) => ({ ...config, description }))
          }
          placeholder={t("placeholders.staysIntro")}
          maxLength={2000}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.stays")}>
        <ListEditor<EditorAccommodation>
          items={draft.accommodations}
          onChange={(accommodations) => update("accommodations", accommodations)}
          emptyLabel={t("empty.stays")}
          addLabel={t("actions.addStay")}
          max={30}
          createItem={() => ({
            id: newId(),
            name: "",
            city: "",
            distance: "",
            address: "",
            phone: "",
            bookingUrl: "",
            offer: "",
            photoUrl: "",
            secondary: false,
          })}
          hasContent={(stay) =>
            Object.entries(stay).some(([key, value]) => key !== "id" && key !== "secondary" && Boolean(value))
          }
          summary={(stay) => [stay.name, stay.distance].filter(Boolean).join(" · ")}
          renderItem={(stay, patch) => (
            <>
              <TextField
                label={t("fields.stayName")}
                value={stay.name}
                onChange={(name) => patch({ name })}
                maxLength={160}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={t("fields.stayCity")}
                  value={stay.city}
                  onChange={(city) => patch({ city })}
                  maxLength={120}
                />
                <TextField
                  label={t("fields.stayDistance")}
                  value={stay.distance}
                  onChange={(distance) => patch({ distance })}
                  placeholder={t("placeholders.stayDistance")}
                  maxLength={80}
                />
              </div>
              <TextField
                label={t("fields.stayAddress")}
                value={stay.address}
                onChange={(address) => patch({ address })}
                maxLength={300}
              />
              <TextField
                label={t("fields.stayUrl")}
                value={stay.bookingUrl}
                onChange={(bookingUrl) => patch({ bookingUrl })}
                type="url"
                inputMode="url"
                placeholder={t("placeholders.url")}
                maxLength={2000}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={t("fields.stayOffer")}
                  value={stay.offer}
                  onChange={(offer) => patch({ offer })}
                  maxLength={500}
                />
                <TextField
                  label={t("fields.stayPhone")}
                  value={stay.phone}
                  onChange={(phone) => patch({ phone })}
                  type="tel"
                  inputMode="tel"
                  maxLength={40}
                />
              </div>
              <ImageField
                label={t("fields.stayPhoto")}
                value={stay.photoUrl}
                onChange={(photoUrl) => patch({ photoUrl })}
                folder="accommodations"
                aspect="square"
              />
              <ToggleField
                label={t("fields.staySecondary")}
                description={t("hints.staySecondary")}
                checked={stay.secondary}
                onChange={(secondary) => patch({ secondary })}
              />
            </>
          )}
        />
      </FieldGroup>

      <SlotFields section="accommodation" />
    </FormLayout>
  );
}

"use client";

import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { DateField } from "../fields/DateField";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { FormLayout, dottedDate, initials, useCeremony } from "./shared";

/**
 * The first screen of the invitation: the couple, the words around their
 * names, when and where.
 *
 * The venue's name and city are here as well as in "Lieu": the hero prints
 * them whatever the couple bought, and the "Lieu" tab only exists for couples
 * who bought the map module. Both fields edit the same draft.
 */
export function HeroForm() {
  const t = useTranslations("Editor");
  const { draft, update, setText } = useEditor();
  const { ceremony, setCeremony } = useCeremony();

  return (
    <FormLayout>
      <SectionIntro section="hero" />

      <FieldGroup title={t("groups.couple")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("fields.partner1")}
            value={draft.names.partner1}
            onChange={(partner1) => update("names", (names) => ({ ...names, partner1 }))}
            maxLength={60}
          />
          <TextField
            label={t("fields.partner2")}
            value={draft.names.partner2}
            onChange={(partner2) => update("names", (names) => ({ ...names, partner2 }))}
            maxLength={60}
          />
        </div>
        <TextField
          label={t("fields.monogram")}
          value={draft.texts["couple.monogram"] ?? ""}
          onChange={(value) => setText("couple.monogram", value)}
          placeholder={initials(draft.names)}
          hint={t("hints.monogram")}
          maxLength={20}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.heroWords")} description={t("groups.heroWordsDescription")}>
        <TextField
          label={t("fields.heroKicker")}
          value={draft.settings.heroKicker}
          onChange={(heroKicker) => update("settings", (settings) => ({ ...settings, heroKicker }))}
          placeholder={t("placeholders.heroKicker")}
          maxLength={160}
        />
        <TextField
          label={t("fields.announcement")}
          value={draft.settings.announcement}
          onChange={(announcement) =>
            update("settings", (settings) => ({ ...settings, announcement }))
          }
          placeholder={t("placeholders.announcement")}
          multiline
          rows={2}
          maxLength={600}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.when")} description={t("groups.whenDescription")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            label={t("fields.weddingDate")}
            value={ceremony?.date ?? ""}
            onChange={(date) => setCeremony({ date })}
          />
          <TextField
            label={t("fields.ceremonyTime")}
            value={ceremony?.time ?? ""}
            onChange={(time) => setCeremony({ time })}
            placeholder="16h00"
            hint={t("hints.ceremonyTime")}
            maxLength={20}
          />
        </div>
        <TextField
          label={t("fields.dateLabel")}
          value={draft.texts["copy.dateLabel"] ?? ""}
          onChange={(value) => setText("copy.dateLabel", value)}
          placeholder={dottedDate(ceremony?.date)}
          hint={t("hints.dateLabel")}
          maxLength={80}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.where")} description={t("groups.whereDescription")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("fields.venueName")}
            value={draft.venue.name}
            onChange={(name) => update("venue", (venue) => ({ ...venue, name }))}
            maxLength={160}
          />
          <TextField
            label={t("fields.venueCity")}
            value={draft.venue.city}
            onChange={(city) => update("venue", (venue) => ({ ...venue, city }))}
            maxLength={120}
          />
        </div>
      </FieldGroup>

      <SlotFields section="hero" />
    </FormLayout>
  );
}

"use client";

import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { DateField } from "../fields/DateField";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { FormLayout, spelledDate, useCeremony } from "./shared";

/**
 * The countdown counts to the ceremony, so its date and time are edited here
 * too — the same values as in "Accueil", not a second copy.
 */
export function CountdownForm() {
  const t = useTranslations("Editor");
  const { draft, setText } = useEditor();
  const { ceremony, setCeremony } = useCeremony();

  return (
    <FormLayout>
      <SectionIntro section="countdown" />

      <FieldGroup title={t("groups.countdownTarget")} description={t("groups.countdownTargetDescription")}>
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
          label={t("fields.dateSpelled")}
          value={draft.texts["copy.dateSpelled"] ?? ""}
          onChange={(value) => setText("copy.dateSpelled", value)}
          placeholder={spelledDate(ceremony?.date)}
          hint={t("hints.dateSpelled")}
          maxLength={80}
        />
      </FieldGroup>

      <SlotFields section="countdown" />
    </FormLayout>
  );
}

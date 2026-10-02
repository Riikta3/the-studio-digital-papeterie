"use client";

import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { ImageField } from "../fields/ImageField";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { FormLayout } from "./shared";

/** The last page: the couple's parting words, a small note, their portrait. */
export function FooterForm() {
  const t = useTranslations("Editor");
  const { draft, update, setText } = useEditor();

  return (
    <FormLayout>
      <SectionIntro section="footer" />

      <FieldGroup title={t("groups.closing")}>
        <TextField
          label={t("fields.closingWords")}
          value={draft.settings.closingWords}
          onChange={(closingWords) => update("settings", (settings) => ({ ...settings, closingWords }))}
          placeholder={t("placeholders.closingWords")}
          hint={t("hints.closingWords")}
          multiline
          rows={2}
          maxLength={600}
        />
        <TextField
          label={t("fields.footerNote")}
          value={draft.texts["copy.footerNote"] ?? ""}
          onChange={(value) => setText("copy.footerNote", value)}
          placeholder={t("placeholders.footerNote")}
          maxLength={200}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.portrait")} description={t("groups.portraitDescription")}>
        <ImageField
          label={t("fields.couplePhoto")}
          value={draft.settings.couplePhotoUrl}
          onChange={(couplePhotoUrl) =>
            update("settings", (settings) => ({ ...settings, couplePhotoUrl }))
          }
          folder="couple"
          aspect="square"
        />
      </FieldGroup>

      <SlotFields section="footer" />
    </FormLayout>
  );
}

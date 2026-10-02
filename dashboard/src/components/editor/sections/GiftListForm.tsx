"use client";

import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { text } from "../fields/coerce";
import type { ModuleConfig } from "../types";
import { FormLayout } from "./shared";

/**
 * A word about gifts, in the couple's voice, and the link to their registry.
 *
 * Nothing is pre-filled: the text speaks for the couple about money, so it
 * has to be something they wrote, not something they published by saving.
 */
export function GiftListForm() {
  const t = useTranslations("Editor");
  const { draft, updateModule } = useEditor();
  const config = draft.modules["gift-list"] ?? {};
  const patch = (values: ModuleConfig) =>
    updateModule("gift-list", (current) => ({ ...current, ...values }));

  return (
    <FormLayout>
      <SectionIntro section="gift-list" />

      <FieldGroup title={t("groups.gift")}>
        <TextField
          label={t("fields.giftTitle")}
          value={text(config.title)}
          onChange={(title) => patch({ title })}
          placeholder={t("placeholders.giftTitle")}
          maxLength={160}
        />
        <TextField
          label={t("fields.giftText")}
          value={text(config.description)}
          onChange={(description) => patch({ description })}
          multiline
          rows={4}
          maxLength={2000}
        />
        <TextField
          label={t("fields.giftUrl")}
          type="url"
          value={text(config.gift_list_url)}
          onChange={(gift_list_url) => patch({ gift_list_url })}
          placeholder={t("placeholders.url")}
          maxLength={2000}
        />
        <TextField
          label={t("fields.giftLinkLabel")}
          value={text(config.gift_list_label)}
          onChange={(gift_list_label) => patch({ gift_list_label })}
          placeholder={t("placeholders.giftLinkLabel")}
          maxLength={80}
        />
      </FieldGroup>

      <SlotFields section="gift-list" />
    </FormLayout>
  );
}

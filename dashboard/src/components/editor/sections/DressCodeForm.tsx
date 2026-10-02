"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useEditor } from "../EditorProvider";
import { ColorPaletteField } from "../fields/ColorPaletteField";
import { FieldGroup } from "../fields/FieldGroup";
import { ImageField } from "../fields/ImageField";
import { SectionIntro } from "../fields/SectionIntro";
import { SegmentedControl } from "../fields/SegmentedControl";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { strings, text } from "../fields/coerce";
import type { ModuleConfig } from "../types";
import { FormLayout } from "./shared";

const MODES = ["global", "split"] as const;
type DressMode = (typeof MODES)[number];

/**
 * What guests may wear: guidance for everyone or per audience, a palette of
 * swatches, an inspiration photo and a closing note.
 *
 * The title field writes `subtitle`, not `title`: the landing prints
 * `subtitle` as the dress code's heading and only falls back to `title` — the
 * "Dress Code" label the old module screen saved — when it is empty. That
 * legacy `title` is left alone and shown as the placeholder, since it is what
 * the invitation prints while the field stays empty.
 *
 * Switching mode keeps the other mode's texts: the landing reads only the
 * active mode's, so switching back loses nothing.
 */
export function DressCodeForm() {
  const t = useTranslations("Editor");
  const { draft, updateModule } = useEditor();
  const config = draft.modules["dress-code"] ?? {};
  const patch = (values: ModuleConfig) =>
    updateModule("dress-code", (current) => ({ ...current, ...values }));

  const mode: DressMode = config.mode === "split" ? "split" : "global";
  // The guidance fades in when the couple switches mode, not when the tab opens.
  const [switched, setSwitched] = useState(false);

  return (
    <FormLayout>
      <SectionIntro section="dress-code" />

      <FieldGroup title={t("groups.dress")}>
        <TextField
          label={t("fields.dressTitle")}
          value={text(config.subtitle)}
          onChange={(subtitle) => patch({ subtitle })}
          placeholder={text(config.title).trim() || t("placeholders.dressTitle")}
          maxLength={160}
        />

        <SegmentedControl
          label={t("fields.dressMode")}
          value={mode}
          options={MODES.map((value) => ({ value, label: t(`dressModes.${value}`) }))}
          onChange={(next) => {
            setSwitched(true);
            patch({ mode: next });
          }}
        />

        <motion.div
          key={mode}
          initial={switched ? { opacity: 0, y: -4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {mode === "global" ? (
            <TextField
              label={t("fields.dressDescription")}
              value={text(config.description)}
              onChange={(description) => patch({ description })}
              multiline
              rows={4}
              maxLength={2000}
            />
          ) : (
            <>
              <TextField
                label={t("fields.dressMen")}
                value={text(config.description_men)}
                onChange={(description_men) => patch({ description_men })}
                multiline
                rows={3}
                maxLength={2000}
              />
              <TextField
                label={t("fields.dressWomen")}
                value={text(config.description_women)}
                onChange={(description_women) => patch({ description_women })}
                multiline
                rows={3}
                maxLength={2000}
              />
            </>
          )}
        </motion.div>

        <TextField
          label={t("fields.dressNote")}
          value={text(config.note)}
          onChange={(note) => patch({ note })}
          placeholder={t("placeholders.dressNote")}
          maxLength={500}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.palette")}>
        <ColorPaletteField
          label={t("fields.palette")}
          value={strings(config.colors)}
          onChange={(colors) => patch({ colors })}
          max={6}
          hint={t("hints.palette")}
        />
        <ImageField
          label={t("fields.dressPhoto")}
          value={text(config.imageUrl)}
          onChange={(imageUrl) => patch({ imageUrl })}
          folder="dress-code"
        />
      </FieldGroup>

      <SlotFields section="dress-code" />
    </FormLayout>
  );
}

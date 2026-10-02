"use client";

import type { EditorSectionId } from "@shared/data/invitation-sections";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "./FieldGroup";
import { TextField } from "./TextField";

/** Slot roles with a hint worth showing under the field. */
const HINTED_ROLES = new Set(["ribbon", "title", "introTitle", "dayOneTitle"]);

/**
 * The theme's own words for one section — "Bon à savoir", "Le programme", the
 * ITALIA stamp — each rewritable, each showing what the theme prints today as
 * its placeholder.
 *
 * The list comes from the preview, which reads it off the theme itself, so the
 * dashboard needs to know nothing about any theme: a new theme's slots appear
 * here the day it ships. A theme that declares no slot for this section renders
 * nothing at all, which is correct rather than broken.
 */
export function SlotFields({ section }: { section: EditorSectionId }) {
  const t = useTranslations("Editor");
  const { preview, draft, setText } = useEditor();

  if (!preview.ready) {
    return (
      <FieldGroup title={t("slots.groupTitle")}>
        <div className="space-y-3" aria-hidden="true">
          <div className="h-3 w-28 animate-pulse rounded bg-studio-lavande/30" />
          <div className="h-11 animate-pulse rounded-lg bg-studio-lavande/20" />
        </div>
      </FieldGroup>
    );
  }

  const slots = preview.slots.filter((slot) => slot.key.startsWith(`${section}.`));
  if (slots.length === 0) return null;

  return (
    <FieldGroup title={t("slots.groupTitle")} description={t("slots.groupDescription")}>
      {slots.map((slot) => {
        const role = slot.key.slice(section.length + 1);
        const value = draft.texts[slot.key] ?? "";
        const label = t.has(`slots.roles.${role}`) ? t(`slots.roles.${role}`) : role;
        const hint = HINTED_ROLES.has(role) && slot.multiline
          ? t("slots.hints.multiline")
          : role === "ribbon"
            ? t("slots.hints.ribbon")
            : undefined;

        return (
          <TextField
            key={slot.key}
            label={label}
            value={value}
            onChange={(next) => setText(slot.key, next)}
            placeholder={slot.defaultText}
            multiline={slot.multiline}
            rows={2}
            maxLength={600}
            hint={hint}
            action={
              value ? (
                <button
                  type="button"
                  onClick={() => setText(slot.key, "")}
                  className="flex items-center gap-1 text-[11px] font-medium text-studio-violet/60 hover:text-studio-violet"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  {t("slots.reset")}
                </button>
              ) : null
            }
          />
        );
      })}
    </FieldGroup>
  );
}

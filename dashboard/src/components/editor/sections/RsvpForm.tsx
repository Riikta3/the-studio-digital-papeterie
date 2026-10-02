"use client";

import { DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { useEditor } from "../EditorProvider";
import { DateField } from "../fields/DateField";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { ToggleField } from "../fields/ToggleField";
import { uniqueStrings } from "../fields/coerce";
import { inputClass, labelClass } from "../fields/styles";
import type { ModuleConfig } from "../types";
import { FormLayout } from "./shared";

/** The server's caps on `dietary_options`. */
const MAX_DIETS = 15;
const MAX_DIET_LENGTH = 60;

const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** `YYYY-MM-DD` when the parts name a real day, else empty. */
function isoDay(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** An ISO day, a French label ("1er avril 2027"), or whatever `Date` reads — as an ISO day. */
function parseDay(raw: string): string {
  const value = raw.trim();
  if (!value) return "";

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return isoDay(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const french = value.toLowerCase().match(/^(\d{1,2})(?:er)?\s+([a-zéûà]+)\s+(\d{4})$/);
  if (french) {
    const month = FRENCH_MONTHS.indexOf(french[2]);
    return month === -1 ? "" : isoDay(Number(french[3]), month + 1, Number(french[1]));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ""
    : isoDay(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
}

/**
 * The deadline as an ISO day.
 *
 * `rsvp_deadline_iso` decides whenever the row has it — empty included, which
 * is a deadline the couple cleared. Rows saved before it existed only carry
 * `rsvp_deadline`, a label in the couple's language that the invitation still
 * prints ("Merci de répondre avant le 14 novembre 2026"); that label is read
 * back so the field shows the deadline guests see instead of nothing.
 */
function readDeadline(config: ModuleConfig): string {
  if (typeof config.rsvp_deadline_iso === "string") return parseDay(config.rsvp_deadline_iso);
  return typeof config.rsvp_deadline === "string" ? parseDay(config.rsvp_deadline) : "";
}

/**
 * The guests' reply form: its deadline, the sentence above it, and what it
 * asks — a partner's name, a message, children, diets.
 *
 * Three stores meet here: the module config (deadline and questions), the
 * invitation texts (the intro) and `settings.adultsOnly`, which the toggle
 * shows inverted because the couple thinks "children welcome", not "adults
 * only". Partner and message are asked unless switched off, as the landing
 * does for a couple who never opened this tab. The diet select appears on the
 * invitation only when there are diets to offer, so the switch is simply "is
 * the list empty".
 */
export function RsvpForm() {
  const t = useTranslations("Editor");
  const { draft, update, updateModule, setText } = useEditor();
  const config = draft.modules.rsvp ?? {};

  // Every write carries the deadline as read above: the server derives the
  // label from `rsvp_deadline_iso` alone, so a row holding only the legacy
  // label would lose its deadline the first time anything else here changed.
  const patch = (values: ModuleConfig) =>
    updateModule("rsvp", (current) => ({
      ...current,
      rsvp_deadline_iso: readDeadline(current),
      ...values,
    }));

  // Each diet once: they key the chips.
  const diets = uniqueStrings(config.dietary_options);
  const askDiets = diets.length > 0;

  return (
    <FormLayout>
      <SectionIntro section="rsvp" />

      <FieldGroup title={t("groups.rsvpDeadline")}>
        <DateField
          label={t("fields.rsvpDeadline")}
          value={readDeadline(config)}
          onChange={(rsvp_deadline_iso) => patch({ rsvp_deadline_iso })}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.rsvpIntro")}>
        <TextField
          label={t("fields.rsvpIntro")}
          value={draft.texts["copy.rsvpIntro"] ?? ""}
          onChange={(value) => setText("copy.rsvpIntro", value)}
          placeholder={t("placeholders.rsvpIntro")}
          multiline
          rows={2}
          maxLength={600}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.rsvpForm")}>
        <ToggleField
          label={t("fields.allowPartner")}
          description={t("hints.allowPartner")}
          checked={config.allow_partner !== false}
          onChange={(allow_partner) => patch({ allow_partner })}
        />
        <ToggleField
          label={t("fields.collectMessage")}
          description={t("hints.collectMessage")}
          checked={config.collect_message !== false}
          onChange={(collect_message) => patch({ collect_message })}
        />
        <ToggleField
          label={t("fields.allowChildren")}
          description={t("hints.allowChildren")}
          checked={!draft.settings.adultsOnly}
          onChange={(checked) => update("settings", (settings) => ({ ...settings, adultsOnly: !checked }))}
        />
        <ToggleField
          label={t("fields.askDietary")}
          description={t("hints.dietary")}
          checked={askDiets}
          onChange={(on) => patch({ dietary_options: on ? [...DIETARY_OPTIONS_FR] : [] })}
        />

        <AnimatePresence initial={false}>
          {askDiets ? (
            <motion.div
              key="diets"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <DietaryOptionsField
                options={diets}
                onChange={(dietary_options) => patch({ dietary_options })}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </FieldGroup>

      <SlotFields section="rsvp" />
    </FormLayout>
  );
}

/**
 * The diets offered in the reply form's select, as removable chips.
 *
 * Capped as the server caps them, and a diet already listed — whatever its
 * case — cannot be added twice: guests would find it twice in the select.
 */
function DietaryOptionsField({
  options,
  onChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
}) {
  const t = useTranslations("Editor");
  const inputId = useId();
  const [entry, setEntry] = useState("");

  const candidate = entry.trim();
  const full = options.length >= MAX_DIETS;
  const listed = options.some(
    (option) => option.trim().toLocaleLowerCase() === candidate.toLocaleLowerCase(),
  );
  const canAdd = candidate !== "" && !listed && !full;

  const add = () => {
    if (!canAdd) return;
    onChange([...options, candidate]);
    setEntry("");
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className={labelClass}>
        {t("fields.dietary")}
      </label>

      <ul className="flex flex-wrap gap-2" aria-label={t("fields.dietary")}>
        <AnimatePresence initial={false}>
          {options.map((option) => (
            <motion.li
              key={option}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-0.5 rounded-full border border-studio-lavande/60 bg-studio-card-selected py-0.5 pl-3 pr-0.5 text-sm text-studio-violet"
            >
              <span>{option}</span>
              <button
                type="button"
                onClick={() => onChange(options.filter((other) => other !== option))}
                aria-label={t("list.remove", { label: option })}
                className="flex h-8 w-8 items-center justify-center rounded-full text-studio-violet/50 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) {
              event.preventDefault();
              add();
            }
          }}
          maxLength={MAX_DIET_LENGTH}
          placeholder={t("placeholders.diet")}
          disabled={full}
          className={cn(inputClass, "disabled:cursor-not-allowed disabled:opacity-50")}
        />
        <button
          type="button"
          onClick={add}
          disabled={!canAdd}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-studio-lavande/60 px-3 text-sm font-medium text-studio-violet transition-colors hover:border-studio-violet/50 hover:bg-studio-card-selected disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {full ? t("list.full", { max: MAX_DIETS }) : t("actions.addDiet")}
        </button>
      </div>
    </div>
  );
}

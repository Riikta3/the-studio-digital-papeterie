"use client";

import { cn } from "@shared/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { newId, useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { ListEditor } from "../fields/ListEditor";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { keyedRows, records, strings, text } from "../fields/coerce";
import { inputClass } from "../fields/styles";
import type { ModuleConfig } from "../types";
import { FormLayout } from "./shared";

type Dish = { title: string; description: string };
type MenuSection = { id: string; title: string; items: Dish[] };

/** The server's caps. */
const MAX_SECTIONS = 12;
const MAX_DISHES = 30;
const MAX_FOOTER_LINES = 6;
const MAX_FOOTER_LINE = 200;

/** The saved sections, shaped for the list. */
function readSections(value: unknown): MenuSection[] {
  return keyedRows(value, "menu").map((section) => ({
    id: section.id,
    title: text(section.title),
    items: records(section.items).map((dish) => ({
      title: text(dish.title),
      description: text(dish.description),
    })),
  }));
}

/**
 * The footer textarea as the list the server stores: one entry per line, at
 * most six, each at most 200 characters.
 *
 * The server counts entries before it drops the blank ones, so a seventh line
 * — even an empty one — would fail the save. Past six lines the blank ones go
 * first, then the overflow; a line that is too long stops growing, as it would
 * under a `maxLength`.
 */
function toFooter(value: string): string[] {
  if (!value.trim()) return [];
  let lines = value.split("\n");
  if (lines.length > MAX_FOOTER_LINES) lines = lines.filter((line) => line.trim());
  return lines.slice(0, MAX_FOOTER_LINES).map((line) => line.slice(0, MAX_FOOTER_LINE));
}

/**
 * The meal, section by section, and the small print under it.
 *
 * The invitation leaves out dishes with no name and sections with no dish, so
 * the blank dish a new section starts with — there to type into — never shows
 * up empty on the menu.
 */
export function MenuForm() {
  const t = useTranslations("Editor");
  const { draft, updateModule } = useEditor();
  const config = draft.modules.menu ?? {};
  const patch = (values: ModuleConfig) =>
    updateModule("menu", (current) => ({ ...current, ...values }));

  const footer = strings(config.footer);
  // Blank entries only (the old screen saved two) read as an empty field, so
  // its placeholder and hint show.
  const footerText = footer.some((line) => line.trim()) ? footer.join("\n") : "";

  return (
    <FormLayout>
      <SectionIntro section="menu" />

      <FieldGroup title={t("groups.menuSections")}>
        <ListEditor
          items={readSections(config.sections)}
          onChange={(sections) => patch({ sections })}
          summary={(section) =>
            [
              section.title.trim(),
              section.items
                .map((dish) => dish.title.trim())
                .filter(Boolean)
                .join(", "),
            ]
              .filter(Boolean)
              .join(" · ")
          }
          createItem={() => ({ id: newId(), title: "", items: [{ title: "", description: "" }] })}
          addLabel={t("actions.addMenuSection")}
          emptyLabel={t("empty.menu")}
          max={MAX_SECTIONS}
          hasContent={(section) =>
            Boolean(section.title.trim()) ||
            section.items.some((dish) => dish.title.trim() || dish.description.trim())
          }
          renderItem={(section, change) => (
            <>
              <TextField
                label={t("fields.menuSectionTitle")}
                value={section.title}
                onChange={(title) => change({ title })}
                placeholder={t("placeholders.menuSectionTitle")}
                maxLength={80}
              />
              <DishList dishes={section.items} onChange={(items) => change({ items })} />
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.menuNotes")}>
        <TextField
          label={t("fields.dietaryNote")}
          value={text(config.dietaryNote)}
          onChange={(dietaryNote) => patch({ dietaryNote })}
          multiline
          rows={2}
          maxLength={500}
        />
        <TextField
          label={t("fields.menuFooter")}
          value={footerText}
          onChange={(value) => patch({ footer: toFooter(value) })}
          hint={t("hints.menuFooter")}
          multiline
          rows={3}
        />
      </FieldGroup>

      <SlotFields section="menu" />
    </FormLayout>
  );
}

/**
 * The dishes of one section, edited in place. No reordering: a course holds a
 * handful of dishes, typed in the order they are served.
 */
function DishList({ dishes, onChange }: { dishes: Dish[]; onChange: (dishes: Dish[]) => void }) {
  const t = useTranslations("Editor");
  const full = dishes.length >= MAX_DISHES;

  const edit = (index: number, patch: Partial<Dish>) =>
    onChange(dishes.map((dish, i) => (i === index ? { ...dish, ...patch } : dish)));

  return (
    <div className="space-y-2">
      {dishes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-studio-lavande/60 px-3 py-3 text-center text-xs text-studio-violet/55">
          {t("empty.dishes")}
        </p>
      ) : (
        <ul className="space-y-2">
          {dishes.map((dish, index) => {
            const name = `${t("fields.dishTitle")} ${index + 1}`;
            return (
              <li
                key={index}
                className="flex items-start gap-1 rounded-xl border border-studio-lavande/40 bg-studio-card-bg p-2"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    type="text"
                    value={dish.title}
                    onChange={(event) => edit(index, { title: event.target.value })}
                    maxLength={160}
                    placeholder={t("fields.dishTitle")}
                    aria-label={name}
                    className={cn(inputClass, "font-medium")}
                  />
                  <input
                    type="text"
                    value={dish.description}
                    onChange={(event) => edit(index, { description: event.target.value })}
                    maxLength={500}
                    placeholder={t("fields.dishDescription")}
                    aria-label={`${t("fields.dishDescription")} ${index + 1}`}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange(dishes.filter((_, i) => i !== index))}
                  aria-label={t("list.remove", { label: dish.title.trim() || name })}
                  className="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg text-studio-violet/40 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onChange([...dishes, { title: "", description: "" }])}
        disabled={full}
        className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-studio-violet/70 transition-colors hover:bg-studio-card-selected hover:text-studio-violet disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {full ? t("list.full", { max: MAX_DISHES }) : t("actions.addDish")}
      </button>
    </div>
  );
}

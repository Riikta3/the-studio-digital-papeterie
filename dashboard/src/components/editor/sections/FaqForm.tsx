"use client";

import { Baby, History } from "lucide-react";
import { useTranslations } from "next-intl";

import { newId, useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { ListEditor } from "../fields/ListEditor";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { ToggleField } from "../fields/ToggleField";
import type { EditorFaqEntry } from "../types";
import { FormLayout } from "./shared";

/**
 * The FAQ: the couple's own questions, in their order, each publishable or
 * kept as a draft.
 *
 * One question is not theirs to write: "are children invited?" is derived from
 * the RSVP's "Enfants acceptés" switch so the page never contradicts its own
 * form (`landing/.../themes/faq.ts`). The tab says so and points to the switch.
 *
 * Couples who wrote questions in the old FAQ module screen still see them on
 * their invitation, appended after these; the tab offers to take them over, so
 * there is one list to manage.
 */
export function FaqForm() {
  const t = useTranslations("Editor");
  const { draft, meta, update, updateModule, setActiveSection } = useEditor();

  const legacyStillShown =
    meta.legacyFaq.length > 0 &&
    Array.isArray(draft.modules.faq?.questions) &&
    (draft.modules.faq.questions as unknown[]).length > 0;

  const importLegacy = () => {
    update("faq", (faq) => [
      ...faq,
      ...meta.legacyFaq.map((entry) => ({
        id: newId(),
        question: entry.question,
        answer: entry.answer,
        published: true,
      })),
    ]);
    updateModule("faq", (config) => ({ ...config, questions: [] }));
  };

  return (
    <FormLayout>
      <SectionIntro section="faq" />

      {legacyStillShown ? (
        <FieldGroup title={t("groups.legacy")}>
          <div className="flex gap-3 text-sm text-studio-violet">
            <History className="mt-0.5 h-4 w-4 shrink-0 text-studio-violet/60" aria-hidden="true" />
            <p className="leading-relaxed">{t("hints.legacy", { count: meta.legacyFaq.length })}</p>
          </div>
          <button
            type="button"
            onClick={importLegacy}
            className="min-h-10 rounded-full bg-studio-violet px-4 text-sm font-semibold text-white hover:bg-studio-violet-fonce"
          >
            {t("actions.importLegacy")}
          </button>
        </FieldGroup>
      ) : null}

      <FieldGroup title={t("groups.questions")}>
        <ListEditor<EditorFaqEntry>
          items={draft.faq}
          onChange={(faq) => update("faq", faq)}
          emptyLabel={t("empty.questions")}
          addLabel={t("actions.addQuestion")}
          max={40}
          createItem={() => ({ id: newId(), question: "", answer: "", published: true })}
          hasContent={(entry) => Boolean(entry.question || entry.answer)}
          summary={(entry) =>
            [entry.question, entry.published ? "" : t("fields.unpublished")].filter(Boolean).join(" · ")
          }
          renderItem={(entry, patch) => (
            <>
              <TextField
                label={t("fields.question")}
                value={entry.question}
                onChange={(question) => patch({ question })}
                maxLength={300}
              />
              <TextField
                label={t("fields.answer")}
                value={entry.answer}
                onChange={(answer) => patch({ answer })}
                multiline
                rows={4}
                maxLength={3000}
              />
              <ToggleField
                label={t("fields.published")}
                checked={entry.published}
                onChange={(published) => patch({ published })}
              />
            </>
          )}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.childrenQuestion")}>
        <div className="flex gap-3 text-sm text-studio-violet">
          <Baby className="mt-0.5 h-4 w-4 shrink-0 text-studio-violet/60" aria-hidden="true" />
          <p className="leading-relaxed">{t("hints.childrenQuestion")}</p>
        </div>
        {meta.ownedModules.includes("rsvp") ? (
          <button
            type="button"
            onClick={() => setActiveSection("rsvp")}
            className="text-sm font-semibold text-studio-violet-clair underline-offset-4 hover:underline"
          >
            {t("actions.openRsvp")}
          </button>
        ) : null}
      </FieldGroup>

      <SlotFields section="faq" />
    </FormLayout>
  );
}

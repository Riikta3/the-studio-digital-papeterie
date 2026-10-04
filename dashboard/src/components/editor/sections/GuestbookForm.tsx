"use client";

import { Hourglass } from "lucide-react";
import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { text } from "../fields/coerce";
import { FormLayout } from "./shared";

/**
 * The words that introduce the guestbook — written or filmed — on the
 * invitation. The written guestbook is live: guests write from the invitation
 * and the couple reads them in Messages. The video guestbook is not open to
 * guests yet, so its tab says so before anything else; what the couple writes
 * is saved all the same.
 *
 * One form for both modules: they store the same two keys.
 */
export function GuestbookForm({ moduleId }: { moduleId: "guestbook" | "video-guestbook" }) {
  const t = useTranslations("Editor");
  const { draft, updateModule } = useEditor();
  const config = draft.modules[moduleId] ?? {};

  return (
    <FormLayout>
      <SectionIntro section={moduleId} />

      {moduleId === "video-guestbook" && (
        <div className="flex gap-3 rounded-xl border border-studio-lavande/50 bg-studio-card-selected px-4 py-3 text-sm text-studio-violet">
          <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-studio-violet/60" aria-hidden="true" />
          <p className="leading-relaxed">{t("hints.videoGuestbookNotLive")}</p>
        </div>
      )}

      <FieldGroup title={t("groups.guestbook")}>
        <TextField
          label={t("fields.guestbookTitle")}
          value={text(config.title)}
          onChange={(title) => updateModule(moduleId, (current) => ({ ...current, title }))}
          placeholder={t("placeholders.guestbookTitle")}
          maxLength={160}
        />
        <TextField
          label={t("fields.guestbookText")}
          value={text(config.description)}
          onChange={(description) => updateModule(moduleId, (current) => ({ ...current, description }))}
          placeholder={t("placeholders.guestbookText")}
          multiline
          rows={3}
          maxLength={1000}
        />
      </FieldGroup>

      <SlotFields section={moduleId} />
    </FormLayout>
  );
}

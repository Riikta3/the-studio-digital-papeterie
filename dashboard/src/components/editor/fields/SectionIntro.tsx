"use client";

import type { EditorSectionId } from "@shared/data/invitation-sections";
import { AlertCircle, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { useEditor } from "../EditorProvider";
import { sectionErrors } from "../sections/registry";

/**
 * The top of every tab: its name, what it controls, and anything the couple
 * needs to know before typing — that the section is not on their invitation
 * right now and why, or that its last save failed.
 *
 * "Not on the invitation" has two causes that call for different words: the
 * theme does not draw this module at all, or it does but hides the section
 * while it is empty. Both come from what the preview actually drew.
 */
export function SectionIntro({ section }: { section: EditorSectionId }) {
  const t = useTranslations("Editor");
  const { preview, errors, dirtySections } = useEditor();

  const messages = sectionErrors(section, errors, dirtySections.has(section));
  const hidden = preview.ready && !preview.sections.includes(section);
  const unsupported = hidden && !preview.supported.includes(section);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-heading text-2xl text-studio-violet">{t(`sections.${section}.label`)}</h2>
        <p className="mt-1 text-sm leading-relaxed text-studio-violet/65">
          {t(`sections.${section}.description`)}
        </p>
      </div>

      {hidden ? (
        <div className="flex gap-3 rounded-xl border border-studio-lavande/50 bg-studio-card-selected px-4 py-3 text-sm text-studio-violet">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-studio-violet/60" aria-hidden="true" />
          <p className="leading-relaxed">
            {unsupported
              ? t("visibility.unsupported", { theme: preview.themeName ?? "" })
              : t.has(`sections.${section}.empty`)
                ? t(`sections.${section}.empty`)
                : t("visibility.empty")}
          </p>
        </div>
      ) : null}

      {messages.length > 0 ? (
        <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <ul className="space-y-1">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

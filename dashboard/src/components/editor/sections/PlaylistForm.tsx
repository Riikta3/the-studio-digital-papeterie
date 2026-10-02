"use client";

import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/navigation";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { text } from "../fields/coerce";
import { FormLayout } from "./shared";

/**
 * The sentence that invites guests to suggest songs, and the way to the
 * screen where the couple sorts what they suggested.
 *
 * Moderation stays on `/playlist` — it is not part of the invitation. The link
 * opens a new tab: leaving the editor through a client-side navigation would
 * drop an unsaved draft without a word, since `beforeunload` only guards
 * reloads and closed tabs.
 */
export function PlaylistForm() {
  const t = useTranslations("Editor");
  const { draft, updateModule } = useEditor();
  const config = draft.modules.playlist ?? {};

  return (
    <FormLayout>
      <SectionIntro section="playlist" />

      <FieldGroup title={t("groups.playlistIntro")}>
        <TextField
          label={t("fields.playlistIntro")}
          value={text(config.description)}
          onChange={(description) => updateModule("playlist", (current) => ({ ...current, description }))}
          placeholder={t("placeholders.playlistIntro")}
          multiline
          rows={3}
          maxLength={2000}
        />
      </FieldGroup>

      <FieldGroup title={t("groups.playlistModeration")} description={t("hints.playlistModeration")}>
        <Link
          href="/playlist"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-studio-lavande/60 px-4 text-sm font-medium text-studio-violet transition-colors hover:border-studio-violet/50 hover:bg-studio-card-selected"
        >
          {t("actions.openPlaylist")}
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </FieldGroup>

      <SlotFields section="playlist" />
    </FormLayout>
  );
}

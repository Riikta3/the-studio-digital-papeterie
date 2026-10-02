"use client";

import { cn } from "@shared/lib/utils";
import { motion } from "framer-motion";
import { Film, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { deleteIntroVideo, uploadIntroVideo } from "@/actions/media-upload-actions";

import { useEditor } from "../EditorProvider";
import { FieldGroup } from "../fields/FieldGroup";
import { SectionIntro } from "../fields/SectionIntro";
import { SegmentedControl } from "../fields/SegmentedControl";
import { SlotFields } from "../fields/SlotFields";
import { TextField } from "../fields/TextField";
import { text } from "../fields/coerce";
import { hintClass } from "../fields/styles";
import type { ModuleConfig } from "../types";
import { FormLayout } from "./shared";

const SOURCES = ["embed", "upload"] as const;
type VideoSource = (typeof SOURCES)[number];

/** `uploadIntroVideo`'s own checks, repeated to answer before the upload. */
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/**
 * A video that welcomes the guests — a YouTube or Vimeo link, or a file the
 * couple uploads — and the words around it.
 *
 * The config holds one `videoUrl`, for the active source only; the other
 * source's value is kept aside while the tab is open, so switching back and
 * forth loses nothing. A file is uploaded the moment it is picked. Removing it
 * deletes it from storage only when the saved invitation does not show it: a
 * saved video deleted now would break on the live page until the next save,
 * and for good if the couple chose "Annuler".
 */
export function IntroVideoForm() {
  const t = useTranslations("Editor");
  const { draft, saved, updateModule } = useEditor();
  const config = draft.modules["intro-video"] ?? {};
  const patch = (values: ModuleConfig) =>
    updateModule("intro-video", (current) => ({ ...current, ...values }));

  const source: VideoSource = config.videoType === "upload" ? "upload" : "embed";
  const videoUrl = text(config.videoUrl);
  const savedUrl = text(saved.modules["intro-video"]?.videoUrl);

  const fileRef = useRef<HTMLInputElement>(null);
  const stash = useRef<Record<VideoSource, string>>({ embed: "", upload: "" });
  const hintId = useId();
  const [uploading, setUploading] = useState(false);
  // "Retirer" asks for a second click: an upload can take minutes to redo.
  const [armed, setArmed] = useState(false);
  // The video block fades in when the couple changes it, not when the tab opens.
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  const switchSource = (next: VideoSource) => {
    if (next === source) return;
    stash.current = { ...stash.current, [source]: videoUrl };
    setChanged(true);
    patch({ videoType: next, videoUrl: stash.current[next] });
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!VIDEO_TYPES.includes(file.type)) {
      toast.error(t("errors.format"));
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(t("errors.tooBig"));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const { url } = await uploadIntroVideo(formData);
      setChanged(true);
      patch({ videoType: "upload", videoUrl: url });
    } catch (error) {
      console.error("[INTRO_VIDEO_UPLOAD]", error);
      toast.error(t("errors.upload"));
    } finally {
      setUploading(false);
    }
  };

  const remove = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    setChanged(true);
    patch({ videoUrl: "" });
    if (videoUrl && videoUrl !== savedUrl) {
      void deleteIntroVideo(videoUrl).catch((error) => console.warn("[INTRO_VIDEO_DELETE]", error));
    }
  };

  const view = source === "upload" && videoUrl ? "video" : source;

  return (
    <FormLayout>
      <SectionIntro section="intro-video" />

      <FieldGroup title={t("groups.video")}>
        <SegmentedControl
          label={t("fields.videoSource")}
          value={source}
          options={SOURCES.map((value) => ({ value, label: t(`videoSources.${value}`) }))}
          onChange={switchSource}
          disabled={uploading}
        />

        <motion.div
          key={view}
          initial={changed ? { opacity: 0, y: -4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {view === "embed" ? (
            <TextField
              label={t("fields.videoUrl")}
              type="url"
              value={videoUrl}
              onChange={(next) => patch({ videoUrl: next })}
              placeholder={t("placeholders.url")}
              hint={t("hints.videoEmbed")}
              maxLength={2000}
            />
          ) : view === "video" ? (
            <div className="space-y-3">
              <video
                key={videoUrl}
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                className="aspect-video w-full rounded-xl bg-black"
              />
              <button
                type="button"
                onClick={remove}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
                  armed
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "border border-studio-lavande/60 text-studio-violet/70 hover:border-red-200 hover:bg-red-50 hover:text-red-600",
                )}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {armed ? t("list.confirmShort") : t("actions.removeVideo")}
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <input
                ref={fileRef}
                type="file"
                accept={VIDEO_TYPES.join(",")}
                className="hidden"
                aria-label={t("actions.uploadVideo")}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void upload(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void upload(event.dataTransfer.files[0]);
                }}
                disabled={uploading}
                aria-busy={uploading}
                aria-describedby={hintId}
                className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-studio-lavande/60 text-sm font-medium text-studio-violet/70 transition-colors hover:border-studio-violet/40 hover:bg-studio-card-bg hover:text-studio-violet disabled:cursor-wait disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Film className="h-5 w-5" aria-hidden="true" />
                )}
                {uploading ? t("actions.uploading") : t("actions.uploadVideo")}
              </button>
              <p id={hintId} className={hintClass}>
                {t("hints.videoUpload")}
              </p>
            </div>
          )}
        </motion.div>
      </FieldGroup>

      <FieldGroup title={t("groups.videoWords")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("fields.videoTitle")}
            value={text(config.title)}
            onChange={(title) => patch({ title })}
            maxLength={160}
          />
          <TextField
            label={t("fields.videoSubtitle")}
            value={text(config.subtitle)}
            onChange={(subtitle) => patch({ subtitle })}
            maxLength={160}
          />
        </div>
        <TextField
          label={t("fields.videoDescription")}
          value={text(config.description)}
          onChange={(description) => patch({ description })}
          multiline
          rows={3}
          maxLength={2000}
        />
      </FieldGroup>

      <SlotFields section="intro-video" />
    </FormLayout>
  );
}

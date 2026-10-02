"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ExternalLink, Loader2, Monitor, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "@/navigation";

import { DueChip, DueStrip } from "./DueReminder";
import { useEditor } from "./EditorProvider";
import { SectionSwitcher } from "./SectionNav";

/** "ciao-amore" → "Ciao Amore", until the preview reports the theme's real name. */
function titleCase(id: string): string {
  return id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The editor's header: where the couple is, how to leave, whether their work
 * is saved — and, on a phone, which section is open (the laptop lists them
 * beside the form, see `SectionRail`).
 *
 * Everything about saving lives here, in one place, because there is one save
 * for the whole invitation: the status reads the same whichever tab is open.
 */
export function EditorHeader() {
  const t = useTranslations("Editor");
  const router = useRouter();
  const {
    meta,
    preview,
    isDirty,
    status,
    errors,
    save,
    discard,
    previewLocale,
    setPreviewLocale,
    device,
    setDevice,
  } = useEditor();
  const [confirmLeave, setConfirmLeave] = useState(false);

  const themeName = preview.themeName ?? (meta.themeId ? titleCase(meta.themeId) : null);
  const saving = status === "saving";
  const failed = Object.keys(errors).length > 0;
  const publicUrl =
    meta.slug && meta.published
      ? `${meta.landingUrl}/${meta.languages[0] ?? "fr"}/invitation/${meta.slug}`
      : null;

  const leave = () => {
    if (isDirty) setConfirmLeave(true);
    else router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-studio-lavande/40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex items-center gap-3 px-3 py-2.5 md:px-5">
        <button
          type="button"
          onClick={leave}
          className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-studio-lavande/60 px-3 text-sm font-medium text-studio-violet transition-colors hover:border-studio-violet/50 hover:bg-studio-card-selected"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{t("header.back")}</span>
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-lg leading-tight text-studio-violet md:text-xl">
            {t("header.title")}
          </h1>
          {themeName ? (
            <p className="truncate text-xs text-studio-violet/60">
              {t("header.theme", { theme: themeName })}
            </p>
          ) : null}
        </div>

        {meta.languages.length > 1 ? (
          <label className="hidden items-center gap-2 text-xs text-studio-violet/70 md:flex">
            <span className="sr-only">{t("header.previewLanguage")}</span>
            <select
              value={previewLocale}
              onChange={(event) => setPreviewLocale(event.target.value)}
              className="h-9 rounded-full border border-studio-lavande/60 bg-white px-3 text-xs font-semibold uppercase tracking-wide text-studio-violet focus:outline-none focus-visible:ring-2 focus-visible:ring-studio-violet-clair/60"
            >
              {meta.languages.map((language) => (
                <option key={language} value={language}>
                  {language.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div
          role="group"
          aria-label={t("header.device")}
          className="hidden items-center rounded-full border border-studio-lavande/60 p-0.5 lg:flex"
        >
          {(
            [
              ["phone", Smartphone],
              ["desktop", Monitor],
            ] as const
          ).map(([value, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDevice(value)}
              aria-pressed={device === value}
              aria-label={t(`header.devices.${value}`)}
              className={cn(
                "flex h-8 w-9 items-center justify-center rounded-full transition-colors",
                device === value
                  ? "bg-studio-violet text-white"
                  : "text-studio-violet/60 hover:text-studio-violet",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>

        <DueChip />

        <p
          aria-live="polite"
          className={cn(
            "hidden items-center gap-1.5 whitespace-nowrap text-xs xl:flex",
            failed ? "text-red-600" : isDirty ? "text-amber-700" : "text-studio-violet/60",
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              {t("status.saving")}
            </>
          ) : failed ? (
            t("status.failed")
          ) : isDirty ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
              {t("status.unsaved")}
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              {t("status.saved")}
            </>
          )}
        </p>

        <AnimatePresence initial={false}>
          {isDirty && !saving ? (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={discard}
                className="hidden h-9 rounded-full px-3 text-sm text-studio-violet hover:bg-studio-card-selected sm:inline-flex"
              >
                {t("actions.discard")}
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <Button
          type="button"
          onClick={() => void save()}
          disabled={!isDirty || saving}
          title={t("actions.saveShortcut")}
          className="h-9 shrink-0 rounded-full bg-studio-violet px-4 text-sm font-semibold text-white hover:bg-studio-violet-fonce disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {t("actions.save")}
        </Button>

        {publicUrl ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t("actions.view")}
            className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full border border-studio-lavande/60 px-3 text-sm font-medium text-studio-violet transition-colors hover:border-studio-violet/50 hover:bg-studio-card-selected md:flex"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xl:inline">{t("actions.view")}</span>
          </a>
        ) : null}
      </div>

      <SectionSwitcher />
      <DueStrip />

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leave.title")}</DialogTitle>
            <DialogDescription>{t("leave.description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setConfirmLeave(false)}>
              {t("leave.stay")}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/")}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {t("leave.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

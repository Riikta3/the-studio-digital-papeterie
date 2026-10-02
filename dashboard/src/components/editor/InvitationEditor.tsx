"use client";

import type { EditorSectionId } from "@shared/data/invitation-sections";
import { cn } from "@shared/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { EditorHeader } from "./EditorHeader";
import { EditorProvider, useEditor } from "./EditorProvider";
import { ModulePaymentDialog, useModulePaymentReturn } from "./ModulePaymentDialog";
import { ModuleStatusBanner } from "./ModuleStatusBanner";
import { PreviewPanel } from "./PreviewPanel";
import { SectionRail } from "./SectionNav";
import { SECTION_FORMS } from "./sections/forms";
import type { EditorBootstrap } from "./types";

/**
 * The invitation editor: every section of the couple's invitation in one
 * screen, the real theme previewed beside it, one save for everything.
 *
 * See docs/superpowers/specs/2026-09-27-invitation-editor-design.md.
 */
export function InvitationEditor({
  bootstrap,
  initialSection,
  initialAdd,
}: {
  bootstrap: EditorBootstrap;
  initialSection: EditorSectionId;
  initialAdd?: string;
}) {
  return (
    <EditorProvider bootstrap={bootstrap} initialSection={initialSection} initialAdd={initialAdd}>
      <EditorShell />
    </EditorProvider>
  );
}

function EditorShell() {
  const t = useTranslations("Editor");
  const { activeSection, isDirty, save } = useEditor();
  const label = t(`sections.${activeSection}.label`);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Laptop only: the settings column folds away for a bigger preview.
  const [settingsOpen, setSettingsOpen] = useState(true);
  useModulePaymentReturn();

  // ⌘S / Ctrl+S saves, as in every editor the couple has used — and keeps the
  // browser from offering to save the page as a file.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  // Closing the tab or reloading with unsaved changes asks first.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const Form = SECTION_FORMS[activeSection];

  return (
    <div className="flex h-dvh flex-col bg-studio-creme">
      <EditorHeader />

      <div className="flex min-h-0 flex-1">
        <SectionRail />

        {/* The settings column. On a laptop it folds into a thin strip — the
            summary and the preview stay. Its width slides while the form inside
            keeps its own, so the column narrows over a form that fades, rather
            than a form that vanishes; the form leaves the tab order (visibility)
            only once the fold is over. Opening plays it backwards. */}
        <div className="relative flex min-h-0 min-w-0 flex-1 lg:flex-none">
          <div
            className={cn(
              "relative flex min-h-0 min-w-0 flex-1 lg:overflow-hidden lg:border-e lg:border-studio-lavande/40",
              "lg:transition-[width] lg:duration-300 lg:ease-out motion-reduce:transition-none",
              settingsOpen ? "lg:w-[440px] xl:w-[500px] 2xl:w-[540px]" : "lg:w-12",
            )}
          >
            <main
              id="editor-panel"
              aria-label={label}
              className={cn(
                "min-w-0 flex-1 overflow-y-auto lg:w-[440px] lg:flex-none xl:w-[500px] 2xl:w-[540px]",
                "lg:transition-[opacity,visibility] lg:duration-300 lg:ease-out motion-reduce:transition-none",
                !settingsOpen && "lg:invisible lg:opacity-0",
              )}
            >
              <ModuleStatusBanner />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                >
                  <Form />
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Over the folded form; it fades in once the column has narrowed. */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={t("panel.show")}
              title={t("panel.show")}
              className={cn(
                "group absolute inset-y-0 start-0 hidden w-12 flex-col items-center gap-3 pt-4 hover:bg-studio-card-bg lg:flex",
                "transition-[opacity,visibility] duration-200 motion-reduce:transition-none",
                settingsOpen ? "invisible opacity-0" : "visible opacity-100 delay-200",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-studio-violet text-white shadow-studio-card transition-colors group-hover:bg-studio-violet-fonce">
                <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-studio-violet/80 [writing-mode:vertical-rl] rtl:hidden">
                {t("panel.label")}
              </span>
            </button>
          </div>

          {/* Filled violet, ringed off the border it sits on: the white circle
              it replaced was lost against the divider. Its name shows on hover.
              It fades out as the fold starts, and back once the column is open. */}
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            aria-label={t("panel.hide")}
            className={cn(
              "group absolute -end-[18px] top-4 z-20 hidden h-9 w-9 items-center justify-center rounded-full bg-studio-violet text-white shadow-studio-card ring-4 ring-studio-creme hover:bg-studio-violet-fonce focus-visible:outline-none focus-visible:ring-studio-violet-clair/60 lg:flex",
              "transition-[opacity,visibility] duration-150 motion-reduce:transition-none",
              settingsOpen ? "visible opacity-100 delay-200" : "invisible opacity-0",
            )}
          >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute start-full ms-3 whitespace-nowrap rounded-full bg-studio-violet px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-studio-card transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {t("panel.hide")}
            </span>
          </button>
        </div>

        <PreviewPanel open={previewOpen} onClose={() => setPreviewOpen(false)} />
      </div>

      <ModulePaymentDialog />

      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-studio-violet px-5 text-sm font-semibold text-white shadow-studio-card transition-transform active:scale-95 lg:hidden"
      >
        <Eye className="h-4 w-4" aria-hidden="true" />
        {t("preview.open")}
      </button>
    </div>
  );
}

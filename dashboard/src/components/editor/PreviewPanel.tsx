"use client";

import { isEditorSectionId } from "@shared/data/invitation-sections";
import {
  EDITOR_MESSAGE_SOURCE,
  type EditorToPreviewMessage,
  isPreviewToEditorMessage,
} from "@shared/types/editor-preview";
import { cn } from "@shared/lib/utils";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { useEditor } from "./EditorProvider";
import { previewMarks } from "./module-status";
import { toPreviewRows } from "./to-preview-rows";

/** The phone the invitation is designed for, in CSS pixels. */
const PHONE_WIDTH = 390;
/** A laptop, for the desktop view — scaled down to fit the panel. */
const DESKTOP_WIDTH = 1280;
/** The bezel drawn around the phone. */
const BEZEL = 10;
/** Quiet time after the last keystroke before the preview redraws. */
const RENDER_DELAY_MS = 120;

function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return desktop;
}

/**
 * The live preview: the couple's real theme, in an iframe on the landing app,
 * redrawn from their draft as they type.
 *
 * The iframe is a pure renderer (`landing/…/invitation/apercu`). This panel
 * posts it the draft as database rows, tells it which section to scroll to,
 * and listens for what it drew — which sections are visible, and the theme's
 * own words — which the tabs and the forms then show. Messages go to the
 * preview's origin only, and only messages from that iframe are read.
 *
 * The iframe is `meta.previewUrl`, not the public landing: in development the
 * local landing, which runs the same code as this editor.
 *
 * On a laptop it is the right-hand column. Below that it is a full-screen sheet
 * the couple opens with the "Aperçu" button — kept mounted while closed, so the
 * forms still receive the theme's words.
 */
export function PreviewPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("Editor");
  const {
    draft,
    meta,
    activeSection,
    setActiveSection,
    lastSelectionFromPreview,
    setPreviewInfo,
    preview,
    previewLocale,
    device,
    sections,
  } = useEditor();

  // Read by the message listener without re-binding it on every tab change.
  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const isDesktop = useIsDesktop();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(false);
  const [stage, setStage] = useState({ width: 0, height: 0 });

  const src = `${meta.previewUrl}/${previewLocale}/invitation/apercu`;
  const origin = useMemo(() => {
    try {
      return new URL(src).origin;
    } catch {
      return null;
    }
  }, [src]);

  const send = useCallback(
    (message: EditorToPreviewMessage) => {
      const target = iframeRef.current?.contentWindow;
      if (target && origin) target.postMessage(message, origin);
    },
    [origin],
  );

  // Updated after each commit; the render below is posted from a timer that
  // fires after it, and from messages, which arrive after it too.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const sendRender = useCallback(() => {
    if (!readyRef.current) return;
    send({
      source: EDITOR_MESSAGE_SOURCE,
      type: "editor:render",
      themeId: meta.themeId,
      rows: toPreviewRows(draftRef.current, meta),
      ...previewMarks(draftRef.current, meta),
    });
  }, [meta, send]);

  const activeRef = useRef(activeSection);
  useEffect(() => {
    activeRef.current = activeSection;
  }, [activeSection]);
  const firstReport = useRef(true);

  /* -- Inbound -------------------------------------------------------------- */

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!origin || event.origin !== origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isPreviewToEditorMessage(event.data)) return;

      const message = event.data;

      if (message.type === "preview:ready") {
        readyRef.current = true;
        firstReport.current = true;
        sendRender();
      } else if (message.type === "preview:rendered") {
        setPreviewInfo({
          themeName: message.themeName,
          sections: message.sections,
          supported: message.supported,
          slots: message.slots,
        });
        // A deep link opened on a section further down: take the preview there
        // once it has something to scroll.
        if (firstReport.current) {
          firstReport.current = false;
          if (activeRef.current !== "hero") {
            send({ source: EDITOR_MESSAGE_SOURCE, type: "editor:focus", section: activeRef.current });
          }
        }
      } else if (
        message.type === "preview:select" &&
        isEditorSectionId(message.section) &&
        // Only a tab the couple has: a click on a block of a module they did
        // not buy must not open a tab that is not there.
        sectionsRef.current.includes(message.section)
      ) {
        setActiveSection(message.section, { fromPreview: true });
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin, send, sendRender, setActiveSection, setPreviewInfo]);

  // A new language is a new page: wait for it to say it is listening.
  useEffect(() => {
    readyRef.current = false;
  }, [src]);

  /* -- Outbound ------------------------------------------------------------- */

  useEffect(() => {
    const timer = window.setTimeout(sendRender, RENDER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [draft, sendRender]);

  useEffect(() => {
    // A click in the preview already shows that section; scrolling it back to
    // its top would yank the page from under the couple's cursor.
    if (lastSelectionFromPreview.current) return;
    if (readyRef.current) {
      send({ source: EDITOR_MESSAGE_SOURCE, type: "editor:focus", section: activeSection });
    }
  }, [activeSection, lastSelectionFromPreview, send]);

  /* -- Sizing --------------------------------------------------------------- */

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setStage({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const framed = isDesktop;
  const frameWidth = device === "desktop" ? DESKTOP_WIDTH : PHONE_WIDTH + BEZEL * 2;
  const scale =
    framed && stage.width > 0 ? Math.min(1, (stage.width - 32) / frameWidth) : 1;
  const frameHeight = framed && stage.height > 0 ? (stage.height - 32) / scale : 0;

  return (
    <aside
      aria-label={t("preview.label")}
      aria-hidden={!isDesktop && !open ? true : undefined}
      className={cn(
        "flex min-w-0 flex-col bg-[radial-gradient(circle_at_top,_#F2EEF8,_#FFFDE8_70%)]",
        // A column beside the form on a laptop…
        "lg:relative lg:flex-1",
        // …a sheet over everything below that, slid out of the way when closed.
        "max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-300",
        !open && "max-lg:pointer-events-none max-lg:invisible max-lg:translate-y-full",
      )}
    >
      <div className="flex items-center justify-between border-b border-studio-lavande/40 bg-white px-4 py-3 lg:hidden">
        <p className="font-heading text-lg text-studio-violet">{t("preview.title")}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("preview.close")}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-studio-lavande/60 text-studio-violet"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden">
        {!preview.ready ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-studio-violet/70 shadow-studio-card">
              {t("preview.loading")}
            </p>
          </div>
        ) : null}

        {/* One tree for both layouts: swapping it would remount the iframe and
            reload the whole theme on the first render and on every resize
            across the breakpoint. Only the styles change. */}
        <div
          className={cn(framed ? "absolute left-1/2 top-4 origin-top" : "absolute inset-0")}
          style={
            framed
              ? {
                  width: frameWidth,
                  height: frameHeight,
                  transform: `translateX(-50%) scale(${scale})`,
                }
              : undefined
          }
        >
          <div
            className={cn(
              "h-full w-full overflow-hidden bg-white",
              framed && "shadow-studio-card",
              framed && device === "desktop" && "rounded-xl border border-studio-lavande/60",
              framed && device === "phone" && "rounded-[44px] border-studio-violet",
            )}
            style={framed && device === "phone" ? { borderWidth: BEZEL } : undefined}
          >
            <iframe
              ref={iframeRef}
              src={src}
              title={t("preview.frameTitle")}
              className="block h-full w-full border-0"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

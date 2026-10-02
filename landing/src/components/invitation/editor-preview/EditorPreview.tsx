"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  EDITOR_MESSAGE_SOURCE,
  type PreviewToEditorMessage,
  isEditorToPreviewMessage,
} from "@shared/types/editor-preview";
import type { InvitationRows } from "@shared/types/invitation-rows";

import { THEMES, getTheme } from "@/components/invitation/themes/registry";
import { assembleInvitationPage } from "@/lib/assemble-invitation-page";
import { withSamples } from "@/lib/preview-samples";
import { toInvitationData } from "@/lib/to-invitation-data";

import "./editor-preview.css";

/**
 * The live preview inside the dashboard's invitation editor.
 *
 * It holds no data of its own and reads no database: the editor posts the
 * couple's draft, in the row shape the public route reads from Supabase, and
 * this draws it through the very same `assembleInvitationPage` →
 * `toInvitationData` → theme `Root` chain. The couple is looking at their real
 * theme rendering their real (unsaved) words.
 *
 * Guest forms run in demo mode: `weddingId` is dropped, so the RSVP and the
 * playlist confirm locally and write nothing.
 *
 * The protocol is in `shared/types/editor-preview.ts`. Every inbound message is
 * checked for its origin (only the dashboards in `allowedOrigins`), its source
 * window (only the page embedding us), then its shape.
 */

type Draft = { themeId: string | null; rows: InvitationRows; samples: string[]; notLive: string[] };

/** A badge over a section guests cannot see yet, in the preview's own layer. */
type Mark = { id: string; kind: "example" | "locked"; top: number };

/** Clicks on these belong to the invitation itself, not to "edit this section". */
const INTERACTIVE = "a, button, input, select, textarea, label, summary, [role='button']";

/** How long a section stays outlined after the editor asks for it. */
const FLASH_MS = 1200;

/** `preview:ready` is re-sent until the editor answers, in case it missed the first. */
const READY_RETRY_MS = 1000;
const READY_RETRIES = 10;

/**
 * The nearest section around `target` that the couple has a tab for — the
 * hero, the footer, or a module they bought. A block drawn for a module they
 * did not buy (the venue's travel directions answer to "transport") hands the
 * hover and the click to the section around it, rather than naming a tab the
 * editor does not have. `owned` null means no module list: every section is.
 */
function editableSection(target: Element | null, owned: ReadonlySet<string> | null): HTMLElement | null {
  let element = target?.closest<HTMLElement>("[data-editor-section]") ?? null;
  while (element && owned && !owned.has(element.dataset.editorSection ?? "")) {
    element = element.parentElement?.closest<HTMLElement>("[data-editor-section]") ?? null;
  }
  return element;
}

export function EditorPreview({ allowedOrigins }: { allowedOrigins: string[] }) {
  // Root translator: slot defaults are full catalogue keys, across namespaces.
  const t = useTranslations();
  const translate = t as unknown as (key: string) => string;
  const tp = useTranslations("Invitation.editorPreview");

  const [draft, setDraft] = useState<Draft | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  /** The editor that last spoke to us; every reply goes there and nowhere else. */
  const editorOrigin = useRef<string | null>(null);
  /** A focus request that arrived before its section was on the page. */
  const pendingFocus = useRef<string | null>(null);
  /** The sections the couple has a tab for, from the rows last drawn. */
  const ownedRef = useRef<ReadonlySet<string> | null>(null);
  const modules = draft?.rows.site.modules;
  useEffect(() => {
    ownedRef.current = modules?.length ? new Set(["hero", "footer", ...modules]) : null;
  }, [modules]);

  const post = useCallback((message: PreviewToEditorMessage) => {
    const origin = editorOrigin.current;
    if (!origin || window.parent === window) return;
    window.parent.postMessage(message, origin);
  }, []);

  const focusSection = useCallback((section: string): boolean => {
    const root = rootRef.current;
    if (!root) return false;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(
        `[data-editor-section="${CSS.escape(section)}"]`,
      ),
    );
    if (targets.length === 0) return false;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets[0].scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });

    for (const target of targets) target.dataset.editorFlash = "true";
    window.setTimeout(() => {
      for (const target of targets) delete target.dataset.editorFlash;
    }, FLASH_MS);

    return true;
  }, []);

  /* -- Inbound ------------------------------------------------------------ */

  useEffect(() => {
    const allowed = new Set(allowedOrigins);
    let answered = false;

    function onMessage(event: MessageEvent) {
      if (!allowed.has(event.origin)) return;
      // Only the page that embeds us. Another tab holding a reference to this
      // window (say, one that opened it) could share an allowed origin.
      if (event.source !== window.parent) return;
      if (!isEditorToPreviewMessage(event.data)) return;

      answered = true;
      editorOrigin.current = event.origin;
      const message = event.data;

      if (message.type === "editor:render") {
        setDraft({
          themeId: message.themeId,
          rows: message.rows,
          samples: message.samples ?? [],
          notLive: message.notLive ?? [],
        });
      } else if (!focusSection(message.section)) {
        // Not drawn yet — the first render is still on its way. Retried after
        // the next render report below.
        pendingFocus.current = message.section;
      }
    }

    window.addEventListener("message", onMessage);

    // Carries nothing, so it may go to any parent: it only says "I am
    // listening". Repeated a few times in case the editor attached its
    // listener after our first attempt.
    let tries = 0;
    const ready = () => {
      if (answered || window.parent === window) return;
      window.parent.postMessage({ source: EDITOR_MESSAGE_SOURCE, type: "preview:ready" }, "*");
    };
    ready();
    const timer = window.setInterval(() => {
      tries += 1;
      if (answered || tries >= READY_RETRIES) window.clearInterval(timer);
      else ready();
    }, READY_RETRY_MS);

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(timer);
    };
  }, [allowedOrigins, focusSection]);

  /* -- Render ------------------------------------------------------------- */

  const view = useMemo(() => {
    if (!draft) return null;

    // Same fallback as the public route: an unknown id still renders.
    const theme = getTheme(draft.themeId) ?? THEMES[0];
    const page = assembleInvitationPage("preview", "preview", draft.rows);
    const base = page ? { ...toInvitationData(page), weddingId: undefined } : null;
    // Modules the couple has not filled yet show sample content (spec D8).
    const filled = base ? withSamples(base, theme.demoData, draft.samples) : null;

    return {
      theme,
      data: filled?.data ?? null,
      sampled: filled?.sampled ?? [],
      notLive: draft.notLive,
    };
  }, [draft]);

  const layerRef = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<Mark[]>([]);

  /**
   * Outlines on the sections guests cannot see yet, and badges over them in
   * our own layer — not pseudo-elements, which the themes already use on every
   * section. Positions are measured against the layer, so they hold wherever
   * the layer's containing block is.
   */
  const placeMarks = useCallback(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    if (!root || !layer || !view) return;

    for (const element of root.querySelectorAll<HTMLElement>("[data-editor-example], [data-editor-locked]")) {
      delete element.dataset.editorExample;
      delete element.dataset.editorLocked;
    }

    const origin = layer.getBoundingClientRect().top;
    const sampled = new Set(view.sampled);
    const next: Mark[] = [];
    for (const id of new Set([...view.sampled, ...view.notLive])) {
      const element = root.querySelector<HTMLElement>(`[data-editor-section="${CSS.escape(id)}"]`);
      if (!element) continue;
      const kind = sampled.has(id) ? "example" : "locked";
      if (kind === "example") element.dataset.editorExample = "true";
      else element.dataset.editorLocked = "true";
      next.push({ id, kind, top: Math.round(element.getBoundingClientRect().top - origin) });
    }

    setMarks((previous) => (JSON.stringify(previous) === JSON.stringify(next) ? previous : next));
  }, [view]);

  // Images load and fonts swap after the first paint: follow the page's height.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => placeMarks());
    observer.observe(root);
    return () => observer.disconnect();
  }, [placeMarks]);

  /* -- Report what was drawn ------------------------------------------------ */

  useEffect(() => {
    if (!view) return;

    // After paint, so the sections are in the DOM in their final order.
    const frame = window.requestAnimationFrame(() => {
      const root = rootRef.current;
      if (!root) return;

      const sections = Array.from(
        new Set(
          Array.from(root.querySelectorAll<HTMLElement>("[data-editor-section]"))
            .map((element) => element.dataset.editorSection)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      post({
        source: EDITOR_MESSAGE_SOURCE,
        type: "preview:rendered",
        themeName: view.theme.name,
        sections,
        supported: ["hero", ...view.theme.supports, "footer"],
        slots: (view.theme.editorSlots ?? []).map((slot) => ({
          key: slot.key,
          defaultText: slot.messages.map((key) => translate(key)).join("\n"),
          multiline: Boolean(slot.multiline),
        })),
      });

      const pending = pendingFocus.current;
      if (pending) {
        pendingFocus.current = null;
        focusSection(pending);
      }

      placeMarks();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [view, post, translate, focusSection, placeMarks]);

  /* -- Hover and click: "edit this section" ----------------------------------- */

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let hovered: HTMLElement | null = null;

    const clearHover = () => {
      if (hovered) delete hovered.dataset.editorHover;
      hovered = null;
    };

    function onOver(event: PointerEvent) {
      const section = editableSection(event.target as Element | null, ownedRef.current);
      if (section === hovered) return;
      clearHover();
      if (section) {
        section.dataset.editorHover = "true";
        hovered = section;
      }
    }

    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      if (!target || target.closest(INTERACTIVE)) return;

      const section = editableSection(target, ownedRef.current)?.dataset.editorSection;
      if (section) {
        post({ source: EDITOR_MESSAGE_SOURCE, type: "preview:select", section });
      }
    }

    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", clearHover);
    root.addEventListener("click", onClick);

    return () => {
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", clearHover);
      root.removeEventListener("click", onClick);
    };
  }, [post]);

  /* -- Markup --------------------------------------------------------------- */

  const Root = view?.theme.Root;

  return (
    <div ref={rootRef} className="editor-preview-root">
      <div ref={layerRef} className="editor-preview-marks" aria-hidden="true">
        {marks.map((mark) => (
          <span
            key={mark.id}
            className={`editor-preview-mark editor-preview-mark--${mark.kind}`}
            style={{ top: mark.top }}
          >
            {mark.kind === "example" ? tp("example") : tp("notLive")}
          </span>
        ))}
      </div>
      {!view ? (
        <p className="editor-preview-status" role="status">
          {tp("waiting")}
        </p>
      ) : view.data && Root ? (
        <Root data={view.data} />
      ) : (
        <p className="editor-preview-status" role="status">
          {tp("noEvent")}
        </p>
      )}
    </div>
  );
}

"use client";

import { APP_MODULES } from "@shared/data/modules";
import {
  type EditorSectionId,
  isEditorSectionId,
} from "@shared/data/invitation-sections";
import { type AmountDue, amountDue } from "@shared/lib/addable-modules";
import type { PreviewSlot } from "@shared/types/editor-preview";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { saveInvitationDraft } from "@/actions/invitation-editor-actions";
import { removePendingModule } from "@/actions/module-purchase-actions";

import { changedUnits } from "./diff";
import { type ModuleStatus, moduleStatus, previewModules, sectionOrHero, unpaidSplit } from "./module-status";
import {
  type EditorBootstrap,
  type EditorMeta,
  type EditorState,
  type EditorUnit,
  type ModuleConfig,
  type ModuleLists,
  NEW_ID_PREFIX,
} from "./types";

/**
 * The invitation editor's state: the invitation as saved, the couple's draft
 * of it, and what the live preview last reported.
 *
 * One draft for the whole invitation, one "Enregistrer": the couple can move
 * between tabs, see every change in the preview at once, and publish nothing
 * until they decide to. The invitation is live from the moment it is bought,
 * so an autosave would push half-typed sentences to guests.
 */

export type PreviewInfo = {
  /** The preview has drawn at least once. Until then nothing is known about it. */
  ready: boolean;
  themeName: string | null;
  /** Sections present on the page, in the theme's order. */
  sections: string[];
  /** Sections the theme can draw, present or not. */
  supported: string[];
  /** The theme's rewritable words, with their defaults in the preview's language. */
  slots: PreviewSlot[];
};

export type PreviewDevice = "phone" | "desktop";

type Updater<T> = T | ((previous: T) => T);

type EditorContextValue = {
  draft: EditorState;
  saved: EditorState;
  meta: EditorMeta;
  isDirty: boolean;
  /** Tabs where something was edited since the last save or discard. */
  dirtySections: ReadonlySet<EditorSectionId>;
  status: "idle" | "saving";
  errors: Partial<Record<EditorUnit, string>>;

  sections: EditorSectionId[];
  activeSection: EditorSectionId;
  setActiveSection: (id: EditorSectionId, options?: { fromPreview?: boolean }) => void;
  /** Whether the last tab change came from a click in the preview (no scroll back). */
  lastSelectionFromPreview: React.RefObject<boolean>;

  preview: PreviewInfo;
  setPreviewInfo: (info: Omit<PreviewInfo, "ready">) => void;
  previewLocale: string;
  setPreviewLocale: (locale: string) => void;
  device: PreviewDevice;
  setDevice: (device: PreviewDevice) => void;

  update: <K extends Exclude<keyof EditorState, "modules">>(unit: K, next: Updater<EditorState[K]>) => void;
  updateModule: (moduleId: string, next: Updater<ModuleConfig>) => void;
  /** Sets one of `settings.invitation_texts`; an empty value removes the key. */
  setText: (key: string, value: string) => void;

  /** Where a module stands — null when it is not on the invitation at all. */
  statusOf: (moduleId: string) => ModuleStatus | null;
  /** The not-yet-live modules: those the plan includes, those to pay for. */
  unpaid: { free: string[]; billable: string[] };
  /** Saved modules still to pay, and their price. */
  due: AmountDue | null;
  /** Adds a module to the draft and opens its tab — saved and paid later (spec D1). */
  addModule: (moduleId: string) => void;
  /** Takes back a module that is not live: from the draft, or from the saved unpaid list. */
  removeModule: (moduleId: string) => Promise<void>;
  applyModuleLists: (lists: ModuleLists) => void;
  paymentOpen: boolean;
  /** Whether the dialog opened right after the save that stored the modules. */
  paymentFromSave: boolean;
  openPayment: (options?: { fromSave?: boolean }) => void;
  closePayment: () => void;

  save: () => Promise<void>;
  discard: () => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function useEditor(): EditorContextValue {
  const value = useContext(EditorContext);
  if (!value) throw new Error("useEditor must be used inside <EditorProvider>.");
  return value;
}

/** An id for a row that exists only in the draft; the server replaces it. */
export function newId(): string {
  return `${NEW_ID_PREFIX}${crypto.randomUUID()}`;
}

const DEFAULT_ORDER = new Map(APP_MODULES.map((module) => [module.id, module.defaultOrder]));

/**
 * The saved state, with the draft's version of every unit that failed to save
 * — so the couple loses nothing, and the next "Enregistrer" retries only those.
 */
function keepFailed(
  fresh: EditorState,
  draft: EditorState,
  failed: ReadonlySet<string>,
  createdIds: Record<string, string>,
): EditorState {
  const merged: EditorState = { ...fresh, modules: { ...fresh.modules } };

  for (const unit of failed) {
    if (unit.startsWith("modules.")) {
      const id = unit.slice("modules.".length);
      if (draft.modules[id]) merged.modules[id] = draft.modules[id];
    } else if (unit !== "modules") {
      (merged as Record<string, unknown>)[unit] = draft[unit as keyof EditorState];
    }
  }

  // Moments kept from the draft may point at events that were just created
  // under a new id.
  if (failed.has("schedule")) {
    merged.schedule = merged.schedule.map((entry) => ({
      ...entry,
      eventId: createdIds[entry.eventId] ?? entry.eventId,
    }));
  }

  return merged;
}

export function EditorProvider({
  bootstrap,
  initialSection,
  initialAdd,
  children,
}: {
  bootstrap: EditorBootstrap;
  initialSection: EditorSectionId;
  /** `/modules` → `?add=<id>`: the module starts in the draft, as if chosen from the menu. */
  initialAdd?: string;
  children: ReactNode;
}) {
  const t = useTranslations("Editor");
  const [meta, setMeta] = useState(bootstrap.meta);

  const [saved, setSaved] = useState(bootstrap.state);
  const [draft, setDraft] = useState(() =>
    initialAdd && !(initialAdd in bootstrap.state.modules)
      ? { ...bootstrap.state, modules: { ...bootstrap.state.modules, [initialAdd]: {} } }
      : bootstrap.state,
  );
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [errors, setErrors] = useState<Partial<Record<EditorUnit, string>>>({});
  const [dirtySections, setDirtySections] = useState<ReadonlySet<EditorSectionId>>(
    () => new Set(initialAdd && isEditorSectionId(initialAdd) ? [initialAdd] : []),
  );
  const [activeSection, setActive] = useState<EditorSectionId>(initialSection);
  const [preview, setPreview] = useState<PreviewInfo>({
    ready: false,
    themeName: null,
    sections: [],
    supported: [],
    slots: [],
  });
  const [previewLocale, setPreviewLocale] = useState(meta.languages[0] ?? "fr");
  const [device, setDevice] = useState<PreviewDevice>("phone");

  // Read inside the updaters below without making them change identity on
  // every tab switch — forms hold on to them.
  const activeRef = useRef(activeSection);
  activeRef.current = activeSection;
  const lastSelectionFromPreview = useRef(false);

  const touch = useCallback(() => {
    const section = activeRef.current;
    setDirtySections((previous) =>
      previous.has(section) ? previous : new Set(previous).add(section),
    );
  }, []);

  const update = useCallback<EditorContextValue["update"]>(
    (unit, next) => {
      setDraft((previous) => ({
        ...previous,
        [unit]:
          typeof next === "function"
            ? (next as (value: EditorState[typeof unit]) => EditorState[typeof unit])(previous[unit])
            : next,
      }));
      touch();
    },
    [touch],
  );

  const updateModule = useCallback<EditorContextValue["updateModule"]>(
    (moduleId, next) => {
      setDraft((previous) => {
        const current = previous.modules[moduleId] ?? {};
        return {
          ...previous,
          modules: {
            ...previous.modules,
            [moduleId]: typeof next === "function" ? next(current) : next,
          },
        };
      });
      touch();
    },
    [touch],
  );

  const setText = useCallback<EditorContextValue["setText"]>(
    (key, value) => {
      update("texts", (texts) => {
        const next = { ...texts };
        if (value.trim()) next[key] = value;
        else delete next[key];
        return next;
      });
    },
    [update],
  );

  const setActiveSection = useCallback<EditorContextValue["setActiveSection"]>(
    (id, options) => {
      lastSelectionFromPreview.current = Boolean(options?.fromPreview);
      setActive(id);

      // In the URL for deep links, without a server round trip: the whole
      // invitation is already on the client.
      const url = new URL(window.location.href);
      url.searchParams.set("section", id);
      // `null`: with Next's own state the router ignores the change and puts
      // the old address back on its next render (after a save, say).
      window.history.replaceState(null, "", url);
    },
    [],
  );

  // A link to a section the wedding does not own (an old bookmark, a module
  // not bought) opens the hero; say so in the address bar too. `?add=` was
  // consumed by the first render: a reload must not add the module again.
  useEffect(() => {
    const url = new URL(window.location.href);
    const wrongSection = url.searchParams.has("section") && url.searchParams.get("section") !== initialSection;
    if (!wrongSection && !url.searchParams.has("add")) return;
    url.searchParams.delete("add");
    url.searchParams.set("section", initialSection);
    window.history.replaceState(null, "", url);
  }, [initialSection]);

  const setPreviewInfo = useCallback<EditorContextValue["setPreviewInfo"]>((info) => {
    setPreview({ ready: true, ...info });
  }, []);

  const isDirty = useMemo(
    () => Object.keys(changedUnits(saved, draft)).length > 0,
    [saved, draft],
  );

  const sections = useMemo<EditorSectionId[]>(() => {
    // The preview's order when it has one: tabs then walk the invitation top
    // to bottom. Sections it did not draw keep the catalogue's order, after.
    const rank = (id: string) => {
      const index = preview.sections.indexOf(id);
      return index === -1 ? 1000 + (DEFAULT_ORDER.get(id) ?? 99) : index;
    };
    const modules = previewModules({ modules: draft.modules }, meta)
      .filter((id): id is EditorSectionId => isEditorSectionId(id) && id !== "hero" && id !== "footer")
      .sort((a, b) => rank(a) - rank(b));

    return ["hero", ...modules, "footer"];
  }, [draft.modules, meta, preview.sections]);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const metaRef = useRef(meta);
  metaRef.current = meta;

  const applyModuleLists = useCallback((lists: ModuleLists) => {
    setMeta((previous) => ({ ...previous, ownedModules: lists.owned, pendingModules: lists.pending }));
  }, []);

  const [payment, setPayment] = useState({ open: false, fromSave: false });
  const openPayment = useCallback((options?: { fromSave?: boolean }) => {
    setPayment({ open: true, fromSave: Boolean(options?.fromSave) });
  }, []);
  const closePayment = useCallback(() => setPayment((previous) => ({ ...previous, open: false })), []);

  const addModule = useCallback(
    (moduleId: string) => {
      if (!isEditorSectionId(moduleId)) return;
      setDraft((previous) =>
        previous.modules[moduleId] ? previous : { ...previous, modules: { ...previous.modules, [moduleId]: {} } },
      );
      setDirtySections((previous) => new Set(previous).add(moduleId));
      setActiveSection(moduleId);
    },
    [setActiveSection],
  );

  const save = useCallback(async () => {
    const changes = changedUnits(savedRef.current, draftRef.current);
    if (Object.keys(changes).length === 0 || status === "saving") return;

    setStatus("saving");
    try {
      const result = await saveInvitationDraft(changes);

      if (result.ok) {
        setSaved(result.state);
        setDraft(result.state);
        setErrors({});
        setDirtySections(new Set());

        const before = metaRef.current;
        applyModuleLists(result.modules);
        const newlyUnpaid = result.modules.pending.filter((id) => !before.pendingModules.includes(id));
        const newlyLive = result.modules.owned.filter((id) => !before.ownedModules.includes(id));

        // The dialog opens once, on the save that first stores an unpaid
        // module; later saves only say it (spec D1).
        if (result.due && newlyUnpaid.length > 0) openPayment({ fromSave: true });
        else if (newlyLive.length > 0) toast.success(t("save.includedLive", { count: newlyLive.length }));
        else if (result.due) toast.success(t("save.dueSaved"));
        else toast.success(t("save.success"));
        return;
      }

      if (result.state) {
        const failed = new Set(Object.keys(result.errors));
        const fresh = result.state;
        setSaved(fresh);
        setDraft((current) => keepFailed(fresh, current, failed, result.createdIds));
      }
      if (result.modules) applyModuleLists(result.modules);
      setErrors(result.errors);
      toast.error(t("save.partial"));
    } catch (error) {
      console.error("[EDITOR_SAVE]", error);
      toast.error(t("save.network"));
    } finally {
      setStatus("idle");
    }
  }, [status, t, applyModuleLists, openPayment]);

  const discard = useCallback(() => {
    setDraft(savedRef.current);
    setDirtySections(new Set());
    setErrors({});
    // A module added since the save goes with the draft, and so does its tab.
    const section = sectionOrHero(activeRef.current, savedRef.current, metaRef.current);
    if (section !== activeRef.current) setActiveSection(section);
  }, [setActiveSection]);

  const removeModule = useCallback(
    async (moduleId: string) => {
      const status = moduleStatus(moduleId, draftRef.current, metaRef.current);
      const drop = (state: EditorState): EditorState => {
        const modules = { ...state.modules };
        delete modules[moduleId];
        return { ...state, modules };
      };
      const forget = () => {
        setDirtySections((previous) => {
          const next = new Set(previous);
          next.delete(moduleId as EditorSectionId);
          return next;
        });
        setActiveSection("hero");
      };

      if (status === "draft") {
        setDraft(drop);
        forget();
        return;
      }
      if (status !== "unpaid") return;

      const result = await removePendingModule(moduleId);
      if (!result.ok) {
        toast.error(t("moduleStatus.removeFailed"));
        return;
      }
      setSaved(drop);
      setDraft(drop);
      applyModuleLists(result.modules);
      forget();
      toast.success(t("moduleStatus.removed"));
    },
    [applyModuleLists, setActiveSection, t],
  );

  const statusOf = useCallback((moduleId: string) => moduleStatus(moduleId, draft, meta), [draft, meta]);
  const unpaid = useMemo(() => {
    const { free, billable } = unpaidSplit(draft, meta);
    return { free, billable };
  }, [draft, meta]);
  const due = useMemo(
    () => amountDue(meta.planId, meta.ownedModules, meta.pendingModules, meta.themeId),
    [meta],
  );

  const value = useMemo<EditorContextValue>(
    () => ({
      draft,
      saved,
      meta,
      isDirty,
      dirtySections,
      status,
      errors,
      sections,
      activeSection,
      setActiveSection,
      lastSelectionFromPreview,
      preview,
      setPreviewInfo,
      previewLocale,
      setPreviewLocale,
      device,
      setDevice,
      update,
      updateModule,
      setText,
      statusOf,
      unpaid,
      due,
      addModule,
      removeModule,
      applyModuleLists,
      paymentOpen: payment.open,
      paymentFromSave: payment.fromSave,
      openPayment,
      closePayment,
      save,
      discard,
    }),
    [
      draft,
      saved,
      meta,
      isDirty,
      dirtySections,
      status,
      errors,
      sections,
      activeSection,
      setActiveSection,
      preview,
      setPreviewInfo,
      previewLocale,
      device,
      update,
      updateModule,
      setText,
      statusOf,
      unpaid,
      due,
      addModule,
      removeModule,
      applyModuleLists,
      payment,
      openPayment,
      closePayment,
      save,
      discard,
    ],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

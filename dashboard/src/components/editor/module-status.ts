import type { EditorSectionId } from "@shared/data/invitation-sections";
import { type UnpaidSplit, splitUnpaid } from "@shared/lib/addable-modules";

import type { EditorMeta, EditorState } from "./types";

/**
 * Where each module of the draft stands (spec D3): live on the invitation,
 * saved but unpaid, or only in this draft. Pure, so the tabs, the banners and
 * the preview agree with each other and with the server.
 */
export type ModuleStatus = "live" | "unpaid" | "draft";

type Draft = Pick<EditorState, "modules">;
type Lists = Pick<EditorMeta, "ownedModules" | "pendingModules" | "planId" | "themeId">;

/** Modules in the draft that are neither owned nor unpaid: added since the last save. */
export function draftedModules(state: Draft, meta: Lists): string[] {
  const known = new Set([...meta.ownedModules, ...meta.pendingModules]);
  return Object.keys(state.modules).filter((id) => !known.has(id));
}

export function moduleStatus(id: string, state: Draft, meta: Lists): ModuleStatus | null {
  if (meta.ownedModules.includes(id)) return "live";
  if (meta.pendingModules.includes(id)) return "unpaid";
  return id in state.modules ? "draft" : null;
}

/** What the preview draws: owned, then unpaid, then added in this draft. */
export function previewModules(state: Draft, meta: Lists): string[] {
  return [...meta.ownedModules, ...meta.pendingModules, ...draftedModules(state, meta)];
}

/** The tab to show for `id`: itself while the invitation still has it, the hero otherwise. */
export function sectionOrHero(id: EditorSectionId, state: Draft, meta: Lists): EditorSectionId {
  return id === "hero" || id === "footer" || previewModules(state, meta).includes(id) ? id : "hero";
}

/** The not-yet-live modules, split between what the plan includes and what is to pay. */
export function unpaidSplit(state: Draft, meta: Lists): UnpaidSplit {
  return splitUnpaid(
    meta.planId,
    meta.ownedModules,
    [...meta.pendingModules, ...draftedModules(state, meta)],
    meta.themeId,
  );
}

/** Samples for every module guests cannot see yet; "not live" for those still to pay. */
export function previewMarks(state: Draft, meta: Lists): { samples: string[]; notLive: string[] } {
  return {
    samples: [...meta.pendingModules, ...draftedModules(state, meta)],
    notLive: unpaidSplit(state, meta).billable,
  };
}

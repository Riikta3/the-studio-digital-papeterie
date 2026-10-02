import type { EditorSectionId } from "@shared/data/invitation-sections";

import type { ModuleStatus } from "./module-status";

/**
 * The summary the couple moves through the invitation with: a list beside the
 * form on a laptop, a switcher and a sheet on a phone. Pure, so both agree.
 */

export type SectionGroups = {
  intro: EditorSectionId[];
  modules: EditorSectionId[];
  outro: EditorSectionId[];
};

/** The hero, then the modules in the order the theme draws them, then the footer. */
export function groupSections(sections: readonly EditorSectionId[]): SectionGroups {
  return {
    intro: sections.filter((id) => id === "hero"),
    modules: sections.filter((id) => id !== "hero" && id !== "footer"),
    outro: sections.filter((id) => id === "footer"),
  };
}

/** The section before or after `active`, or null at either end. */
export function stepSection(
  sections: readonly EditorSectionId[],
  active: EditorSectionId,
  direction: 1 | -1,
): EditorSectionId | null {
  const index = sections.indexOf(active);
  if (index === -1) return null;
  return sections[index + direction] ?? null;
}

export type SectionBadge = "due" | "price" | "included" | null;

/** What a row says about a module guests cannot see yet: to pay, its price, or included. */
export function sectionBadge(status: ModuleStatus | null, billable: boolean): SectionBadge {
  if (status === "unpaid") return "due";
  if (status === "draft") return billable ? "price" : "included";
  return null;
}

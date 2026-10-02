import { EDITOR_SECTION_IDS } from "../data/invitation-sections";
import { themeModules } from "../data/theme-modules";
import { EXTRA_MODULE_PRICE, addOnQuote } from "./pricing";

/**
 * Which modules a couple can still add, and what the ones they added cost
 * (docs/superpowers/specs/2026-09-28-dashboard-module-purchase-design.md, D2,
 * D3, D9). Pure, so the editor shows exactly what the server will charge.
 */

/** Every module id sold at checkout: the sections minus the two every invitation has. */
const MODULE_IDS: ReadonlySet<string> = new Set(
  EDITOR_SECTION_IDS.filter((id) => id !== "hero" && id !== "footer"),
);

/** Module ids only, once each, in their order. */
export function knownModuleIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].filter((id) => MODULE_IDS.has(id));
}

/** Modules the couple's theme draws that are neither theirs nor already taken, in catalogue order. */
export function addableModules(
  themeId: string | null | undefined,
  owned: readonly string[],
  taken: readonly string[] = [],
): string[] {
  const drawn = new Set(themeModules(themeId));
  const busy = new Set([...owned, ...taken]);
  return EDITOR_SECTION_IDS.filter((id) => MODULE_IDS.has(id) && drawn.has(id) && !busy.has(id));
}

export interface UnpaidSplit {
  /** Covered by what is left of the plan's allowance: granted without payment. */
  free: string[];
  billable: string[];
  /** Not a module, already owned, repeated, or not drawn by the theme: never billed. */
  ignored: string[];
}

/** Splits not-yet-live modules, in the order they were added, between free and billable. */
export function splitUnpaid(
  planId: string | null | undefined,
  owned: readonly string[],
  unpaid: readonly string[],
  themeId: string | null | undefined,
): UnpaidSplit {
  const drawn = new Set(themeModules(themeId));
  const taken = new Set(owned);
  const valid: string[] = [];
  const ignored: string[] = [];

  for (const id of unpaid) {
    if (MODULE_IDS.has(id) && drawn.has(id) && !taken.has(id)) {
      valid.push(id);
      taken.add(id);
    } else {
      ignored.push(id);
    }
  }

  const { included } = addOnQuote(planId, owned.length, valid.length);
  return { free: valid.slice(0, included), billable: valid.slice(included), ignored };
}

export interface AmountDue {
  modules: string[];
  amountCents: number;
}

/** What the saved, unpaid modules cost — null when nothing is due. */
export function amountDue(
  planId: string | null | undefined,
  owned: readonly string[],
  pending: readonly string[],
  themeId: string | null | undefined,
): AmountDue | null {
  const { billable } = splitUnpaid(planId, owned, pending, themeId);
  return billable.length > 0
    ? { modules: billable, amountCents: billable.length * EXTRA_MODULE_PRICE * 100 }
    : null;
}

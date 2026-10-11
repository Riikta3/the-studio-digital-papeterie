/**
 * Bridges the home page's theme dialog with the persisted studio order.
 *
 * The dialog speaks in customer-facing shorthand ("Planning"), while /studio
 * and the pricing/server layers speak in stable catalogue ids (`timeline`). Neither vocabulary can move: the dialog's
 * labels are translated in nine locales, and the catalogue ids reach the
 * database through create-wedding. So the translation lives here, in one
 * place both sides import, rather than being duplicated at each call site.
 */

import type { ModuleKey } from "./ThemeConfigSheet";

/**
 * Dialog module → `APP_MODULES` id (see shared/data/modules.ts).
 *
 * Only "planning" actually differs: the catalogue calls that module
 * `timeline`. Writing "planning" into the order would silently drop the
 * module — /studio/modules would not light it up, and the pricing helper
 * would still bill it as a selected module.
 */
const MODULE_ID_BY_DIALOG_KEY: Record<ModuleKey, string> = {
  guestbook: "guestbook",
  planning: "timeline",
  menu: "menu",
  rsvp: "rsvp",
  accommodation: "accommodation",
  gallery: "gallery",
};

/** The `APP_MODULES` ids for the modules switched on in the dialog. */
export function toOrderModules(modules: Record<ModuleKey, boolean>): string[] {
  return (Object.keys(MODULE_ID_BY_DIALOG_KEY) as ModuleKey[])
    .filter((key) => modules[key])
    .map((key) => MODULE_ID_BY_DIALOG_KEY[key]);
}

/**
 * Rebuilds the dialog's toggles from a persisted order, so reopening the
 * sheet shows what the couple last saved instead of snapping back to the
 * defaults. Modules the dialog does not expose (added later in /studio) are
 * ignored here — they stay in the order untouched only if the caller merges
 * them back, which `toOrderModules` deliberately does not do.
 */
export function fromOrderModules(
  orderModules: string[],
  defaults: Record<ModuleKey, boolean>,
): Record<ModuleKey, boolean> {
  const keys = Object.keys(MODULE_ID_BY_DIALOG_KEY) as ModuleKey[];
  const restored = {} as Record<ModuleKey, boolean>;
  for (const key of keys) {
    restored[key] = orderModules.includes(MODULE_ID_BY_DIALOG_KEY[key]);
  }
  // An order with none of the dialog's modules is indistinguishable from a
  // first visit, so keep the curated defaults rather than showing everything
  // switched off.
  return keys.some((key) => restored[key]) ? restored : defaults;
}

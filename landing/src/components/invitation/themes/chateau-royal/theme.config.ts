import type { ThemeManifest } from "../types";

import { ChateauRoyalRoot } from "./ChateauRoyalRoot";
import { CHATEAU_ROYAL_DEMO } from "./demo-data";
import { chateauRoyalEditorSlots } from "./editor";
import { chateauRoyalFontVars } from "./fonts";

/**
 * Manifest for "Château Royal".
 *
 * This is the only file the rest of the app reads to know the theme exists: the
 * registry, the demo route, the marketing carousel and the studio picker all go
 * through it.
 */
export const chateauRoyalTheme: ThemeManifest = {
  id: "chateau-royal",
  name: "Château Royal",
  description: "Un château de conte au fil d'un jour et d'une nuit : espresso, ivoire et or discret.",

  // Only what the design has a place for. The countdown, the lodgings, the
  // playlist, the gift list, the gallery and the intro video are not drawn.
  supports: ["timeline", "menu", "map", "dress-code", "faq", "transport", "rsvp"],

  accentColor: "#583b32",
  cover: "/themes/chateau-royal/cover.webp",

  scopeClass: "theme-chateau-royal",
  fontVars: chateauRoyalFontVars,

  demoData: CHATEAU_ROYAL_DEMO,
  Root: ChateauRoyalRoot,
  editorSlots: chateauRoyalEditorSlots,
};

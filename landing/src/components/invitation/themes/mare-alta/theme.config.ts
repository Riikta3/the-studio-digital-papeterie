import type { ThemeManifest } from "../types";

import { MareAltaRoot } from "./MareAltaRoot";
import { MARE_ALTA_DEMO } from "./demo-data";
import { mareAltaEditorSlots } from "./editor";
import { mareAltaFontVars } from "./fonts";

/**
 * Manifest for "Maré Alta" — embroidery on linen, a garden by the Atlantic.
 *
 * The only file the rest of the app reads to know the theme exists.
 */
export const mareAltaTheme: ThemeManifest = {
  id: "mare-alta",
  name: "Maré Alta",
  description: "Broderie sur lin ivoire, pins parasols et glycines : un mariage dans une villa de l'Atlantique.",
  supports: [
    "countdown",
    "timeline",
    "dress-code",
    "map",
    "accommodation",
    "transport",
    "menu",
    "playlist",
    "gift-list",
    "rsvp",
    "faq",
  ],
  accentColor: "#4d5845",
  cover: "/themes/mare-alta/cover.webp",
  scopeClass: "theme-mare-alta",
  fontVars: mareAltaFontVars,
  demoData: MARE_ALTA_DEMO,
  Root: MareAltaRoot,
  editorSlots: mareAltaEditorSlots,
};

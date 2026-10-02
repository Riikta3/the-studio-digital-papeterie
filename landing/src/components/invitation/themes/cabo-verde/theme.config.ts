import type { ThemeManifest } from "../types";

import { CaboVerdeRoot } from "./CaboVerdeRoot";
import { CABO_VERDE_DEMO } from "./demo-data";
import { caboVerdeEditorSlots } from "./editor";
import { caboVerdeFontVars } from "./fonts";

/**
 * Manifest for "Cabo Verde".
 *
 * The only file the rest of the app reads to know the theme exists: the
 * registry, the demo route, the studio picker and the editor's preview all go
 * through it.
 */
export const caboVerdeTheme: ThemeManifest = {
  id: "cabo-verde",
  name: "Cabo Verde",
  description: "Pieds dans le sable, eau turquoise et bateaux colorés : un mariage tropical au bord de l'océan.",

  // Only what the design draws. Not drawn, because it has no section for them:
  // menu, faq, gift-list, gallery, intro-video.
  supports: [
    "countdown",
    "map",
    "timeline",
    "dress-code",
    "accommodation",
    "playlist",
    "transport",
    "rsvp",
  ],

  accentColor: "#3aaeb5",
  cover: "/themes/cabo-verde/cover.webp",

  scopeClass: "theme-cabo-verde",
  fontVars: caboVerdeFontVars,

  demoData: CABO_VERDE_DEMO,
  Root: CaboVerdeRoot,
  editorSlots: caboVerdeEditorSlots,
};

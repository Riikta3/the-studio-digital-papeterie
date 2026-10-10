import type { ThemeManifest } from "../types";

import { CABO_VERDE_DEMO } from "./demo-data";
import { caboVerdeEditorSlots } from "./editor";
import { caboVerdeFontVars } from "./fonts";

const loadCaboVerdeRoot = () => import("./CaboVerdeRoot").then((module) => module.CaboVerdeRoot);

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

  // Every module with a guest-facing feature. The designer drew the first
  // eight; the last five are drawn in his grammar in `modules.css`.
  supports: [
    "countdown",
    "map",
    "timeline",
    "dress-code",
    "accommodation",
    "playlist",
    "transport",
    "rsvp",
    "intro-video",
    "gallery",
    "menu",
    "faq",
    "gift-list",
    "guestbook",
  ],

  accentColor: "#3aaeb5",
  cover: "/themes/cabo-verde/cover.webp",

  scopeClass: "theme-cabo-verde",
  fontVars: caboVerdeFontVars,

  demoData: CABO_VERDE_DEMO,
  loadRoot: loadCaboVerdeRoot,
  editorSlots: caboVerdeEditorSlots,
};

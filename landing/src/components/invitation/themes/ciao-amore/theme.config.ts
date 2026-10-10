import type { ThemeManifest } from "../types";

import { CIAO_AMORE_DEMO } from "./demo-data";
import { ciaoAmoreEditorSlots } from "./editor";
import { ciaoAmoreFontVars } from "./fonts";

const loadCiaoAmoreRoot = () => import("./CiaoAmoreRoot").then((module) => module.CiaoAmoreRoot);

/**
 * Manifest for "Ciao Amore".
 *
 * This is the only file the rest of the app reads to know the theme exists:
 * the registry, the demo route, the marketing carousel and the studio picker
 * all go through it. Adding a theme means adding one of these — no central
 * list to edit.
 */
export const ciaoAmoreTheme: ThemeManifest = {
  id: "ciao-amore",
  name: "Ciao Amore",
  description: "Dolce vita sur la côte amalfitaine — citrons, pastel et lumière d'Italie.",

  // The last four have no counterpart in the source project; they were added
  // so a couple who bought them on this theme sees them (`modules.css`).
  supports: [
    "countdown",
    "timeline",
    "dress-code",
    "map",
    "accommodation",
    "playlist",
    "faq",
    "rsvp",
    "intro-video",
    "menu",
    "gallery",
    "gift-list",
    "guestbook",
    // Drawn inside the venue section, as its travel directions.
    "transport",
  ],

  accentColor: "#566247",
  cover: "/themes/ciao-amore/hero-arch.webp",

  scopeClass: "theme-ciao-amore",
  fontVars: ciaoAmoreFontVars,

  demoData: CIAO_AMORE_DEMO,
  loadRoot: loadCiaoAmoreRoot,
  editorSlots: ciaoAmoreEditorSlots,
};

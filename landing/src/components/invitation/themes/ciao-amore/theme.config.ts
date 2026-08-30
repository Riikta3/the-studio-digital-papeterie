import type { ThemeManifest } from "../types";

import { CiaoAmoreRoot } from "./CiaoAmoreRoot";
import { CIAO_AMORE_DEMO } from "./demo-data";
import { ciaoAmoreFontVars } from "./fonts";

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

  supports: [
    "countdown",
    "timeline",
    "dress-code",
    "map",
    "accommodation",
    "playlist",
    "faq",
    "rsvp",
  ],

  accentColor: "#566247",
  cover: "/themes/ciao-amore/hero-arch.webp",

  scopeClass: "theme-ciao-amore",
  fontVars: ciaoAmoreFontVars,

  demoData: CIAO_AMORE_DEMO,
  Root: CiaoAmoreRoot,
};

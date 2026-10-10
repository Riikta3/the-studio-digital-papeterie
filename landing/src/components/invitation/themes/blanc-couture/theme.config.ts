import type { ThemeManifest } from "../types";

import { BlancCoutureRoot } from "./BlancCoutureRoot";
import { BLANC_COUTURE_DEMO } from "./demo-data";
import { blancCoutureFontVars } from "./fonts";

/**
 * Manifest for "Blanc Couture".
 *
 * This is the only file the rest of the app reads to know the theme exists:
 * the registry, the demo route, the marketing carousel and the studio picker
 * all go through it.
 *
 * `transport` covers the carpooling section — the catalogue has no `carpool`
 * module, and inventing one in `ModuleId` would put a value in the type with no
 * matching row in `public.modules`, so nothing could sell it.
 */
export const blancCoutureTheme: ThemeManifest = {
  id: "blanc-couture",
  name: "Blanc Couture",
  description: "Papeterie blanche et dorure fine — l'élégance couture de la Riviera.",

  supports: [
    "countdown",
    "map",
    "timeline",
    "dress-code",
    "accommodation",
    "transport",
    "playlist",
    "faq",
    "rsvp",
  ],

  accentColor: "#9b742f",
  cover: "/themes/blanc-couture/hero-white.webp",

  // The designer's opening film (floral gold seal on handmade paper), played before the page.
  opening: {
    video: "/themes/blanc-couture/opening.mp4",
    poster: "/themes/blanc-couture/opening-poster.webp",
    color: "#e8d8d8",
  },

  scopeClass: "theme-blanc-couture",
  fontVars: blancCoutureFontVars,

  demoData: BLANC_COUTURE_DEMO,
  Root: BlancCoutureRoot,
};

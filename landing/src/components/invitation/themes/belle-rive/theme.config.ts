import type { InvitationData, ThemeManifest } from "../types";

import { BelleRiveRoot } from "./BelleRiveRoot";
import { BELLE_RIVE_DEMO, BELLE_RIVE_DEMO_TRIPS } from "./demo-data";
import { belleRiveFontVars } from "./fonts";

/**
 * The manifest's `Root` is `ComponentType<{ data }>` — one prop, the same for
 * every theme. Carpooling is not part of that contract and widening it for a
 * single theme would be the wrong trade, so the demo trips are bound here.
 * A wedding rendered through the registry gets no trips, and the panel is
 * skipped; only this manifest's demo shows it.
 */
function BelleRiveDemoRoot({ data }: { data: InvitationData }) {
  return BelleRiveRoot({ data, trips: BELLE_RIVE_DEMO_TRIPS });
}

/**
 * Manifest for "Belle Rive".
 *
 * This is the only file the rest of the app reads to know the theme exists:
 * the registry, the demo route, the marketing carousel and the studio picker
 * all go through it.
 */
export const belleRiveTheme: ThemeManifest = {
  id: "belle-rive",
  name: "Belle Rive",
  description: "Élégance Riviera — nacre, olivier et dorures pour un mariage au soleil.",

  supports: [
    "countdown",
    "map",
    "timeline",
    "dress-code",
    "accommodation",
    "playlist",
    "faq",
    "rsvp",
    "gift-list",
  ],

  accentColor: "#a9906e",
  cover: "/themes/belle-rive/domaine.webp",

  scopeClass: "theme-belle-rive",
  fontVars: belleRiveFontVars,

  demoData: BELLE_RIVE_DEMO,
  Root: BelleRiveDemoRoot,
};

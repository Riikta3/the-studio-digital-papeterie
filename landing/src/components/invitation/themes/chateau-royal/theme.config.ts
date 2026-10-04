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

  // Every guest-facing module. The designer drew seven; the countdown, the film,
  // the playlist, the gallery, the lodgings, the gift note and the guestbook are drawn in the
  // same language (`modules.css`).
  supports: [
    "countdown",
    "intro-video",
    "timeline",
    "menu",
    "map",
    "playlist",
    "gallery",
    "dress-code",
    "faq",
    "transport",
    "accommodation",
    "gift-list",
    "rsvp",
    "guestbook",
  ],

  accentColor: "#583b32",
  cover: "/themes/chateau-royal/cover.webp",

  scopeClass: "theme-chateau-royal",
  fontVars: chateauRoyalFontVars,

  demoData: CHATEAU_ROYAL_DEMO,
  Root: ChateauRoyalRoot,
  editorSlots: chateauRoyalEditorSlots,
};

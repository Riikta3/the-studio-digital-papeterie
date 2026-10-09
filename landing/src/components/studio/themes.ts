/**
 * The studio offers exactly the themes the home page shows: one catalogue,
 * `components/home/themes.ts`, so a theme added there appears in the hero, the
 * phone preview, the « Comment ça marche » cards, the studio's theme step and
 * the checkout summary at once. `theme-catalogue.test.mjs` fails when a theme
 * folder has no entry there.
 *
 * This file used to hold its own list, with a typographic card per theme,
 * which had to be kept in step by hand.
 */
export { THEMES, type Theme } from "@/components/home/themes";

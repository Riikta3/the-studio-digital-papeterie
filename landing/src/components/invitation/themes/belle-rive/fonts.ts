import localFont from "next/font/local";

/**
 * Fonts for the "Belle Rive" theme.
 *
 * The theme is almost entirely system-font: the source sets Georgia for body
 * copy and Arial for its uppercase micro-labels, and neither is worth a web
 * request. Only the calligraphic face is a real asset, and the source pulled it
 * in with a raw `@font-face` in a global stylesheet. Loading it through
 * `next/font/local` instead gives it a hashed URL, a preload hint and — the
 * reason it matters here — a CSS variable, so `belle-rive.css` can reference it
 * without a font-family name that could collide with another theme's.
 *
 * Apply `belleRiveFontVars` on the theme root, next to `.theme-belle-rive`.
 */

/** Couple names in the hero and in the closing arch (`.calligraphy`). */
const script = localFont({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  src: "../../../../../public/themes/belle-rive/calligraphy.otf",
  display: "swap",
  variable: "--font-br-script",
  // Georgia is metrically nothing like a copperplate script, but it is what the
  // rest of the theme uses, so a failed load degrades to something consistent.
  fallback: ["Snell Roundhand", "Segoe Script", "Georgia", "cursive"],
});

export const belleRiveFontVars = script.variable;

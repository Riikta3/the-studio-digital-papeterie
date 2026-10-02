import { Bodoni_Moda, Cormorant_Garamond, Jost } from "next/font/google";

/**
 * Fonts for the "Maré Alta" theme.
 *
 * The designer's sheet names system faces: Didot and Avenir Next (Apple only)
 * and Georgia. Apple devices keep exactly what was approved — the pipeline
 * leaves those names first — and these web faces come right after them, so
 * Windows and Android stop falling back to a generic serif and Arial.
 *
 * Apply `mareAltaFontVars` on the theme root, next to `.theme-mare-alta`.
 */

/** Headings, the couple's names, the countdown digits: Didot's stand-in. */
const display = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ma-display",
});

/** Eyebrows, labels, buttons, form controls: Avenir Next's stand-in. */
const sans = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-ma-sans",
});

/** Running text and italics: Georgia's stand-in on devices without it. */
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-ma-serif",
});

export const mareAltaFontVars = [display.variable, sans.variable, serif.variable].join(" ");

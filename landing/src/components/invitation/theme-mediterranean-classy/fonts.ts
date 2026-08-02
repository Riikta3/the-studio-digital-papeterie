import { Ballet, Cormorant_Garamond, Cormorant_Infant, Jost } from "next/font/google";

/**
 * Fonts for the "Mediterranean Classy" theme, per section 02 of the Figma
 * design system. Scoped to the theme rather than the root layout so the
 * rest of the landing keeps loading only Urbanist + Libre Caslon Display.
 *
 * Apply `mediterraneanFontVars` on the theme root element.
 */

/** display/script — couple names in the hero */
const ballet = Ballet({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-mc-script",
});

/** heading/xl, heading/lg, body/serif-md, body/serif-sm */
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-mc-serif",
});

/** display/number-lg, display/time — countdown digits and schedule times */
const cormorantInfant = Cormorant_Infant({
  subsets: ["latin"],
  weight: ["300", "600"],
  display: "swap",
  variable: "--font-mc-numeric",
});

/** body/sans-md, body/sans-sm, label/sans */
const jost = Jost({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-mc-sans",
});

export const mediterraneanFontVars = [
  ballet.variable,
  cormorantGaramond.variable,
  cormorantInfant.variable,
  jost.variable,
].join(" ");

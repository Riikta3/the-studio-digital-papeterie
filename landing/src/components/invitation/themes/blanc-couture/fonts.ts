import { Bodoni_Moda, Italiana, Manrope } from "next/font/google";

/**
 * Fonts for the "Blanc Couture" theme.
 *
 * The source project pulled all three through one blocking `@import url(...)`
 * at the top of its global stylesheet. Loading them through `next/font` instead
 * keeps the request off the critical path and scopes them to this theme: the
 * landing itself keeps loading only its own faces.
 *
 * Apply `blancCoutureFontVars` on the theme root, next to `.theme-blanc-couture`.
 */

/** Display face: the couple's names, every `h2`, the monograms, the countdown. */
const italiana = Italiana({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-bc-display",
});

/**
 * The italic serif that carries every "script" line, the intros and the
 * timeline hours. The source only ever uses it in italic, but the upright
 * weight is requested too so a browser never has to synthesise one.
 */
const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-bc-serif",
});

/** Body copy, uppercase labels and form controls. */
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-bc-sans",
});

export const blancCoutureFontVars = [
  italiana.variable,
  bodoniModa.variable,
  manrope.variable,
].join(" ");

import {
  Italiana,
  Libre_Caslon_Display,
  Montserrat,
  Parisienne,
} from "next/font/google";

/**
 * Fonts for the "Ciao Amore" theme.
 *
 * The source project pulled these through a blocking `@import url(...)` at the
 * top of its global stylesheet. Loading them through `next/font` instead keeps
 * the request off the critical path and, more importantly, scopes them: the
 * landing itself keeps loading only its own faces.
 *
 * Apply `ciaoAmoreFontVars` on the theme root element, next to `.theme-ciao-amore`.
 */

/** Section headings (`h2`), venue names, timeline titles. */
const italiana = Italiana({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-ca-display",
});

/** Couple names in the hero, and the `.date-script` line under the countdown. */
const parisienne = Parisienne({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-ca-script",
});

/** Timeline descriptions — the serif body face. */
const libreCaslon = Libre_Caslon_Display({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  variable: "--font-ca-serif",
});

/** Body copy, labels, form controls. */
const montserrat = Montserrat({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-ca-sans",
});

export const ciaoAmoreFontVars = [
  italiana.variable,
  parisienne.variable,
  libreCaslon.variable,
  montserrat.variable,
].join(" ");

import { Jost, Pinyon_Script } from "next/font/google";
import localFont from "next/font/local";

/**
 * Fonts for the "Château Royal" theme.
 *
 * The designer loaded these three from a Google Fonts `<link>`; the pipeline puts
 * each `next/font` variable *first* in every `font` that names one of them.
 * (The handoff note lists Italiana too; the stylesheet never uses it, so it is
 * not loaded.)
 *
 * Apply `chateauRoyalFontVars` on the theme root.
 */

/**
 * Titles, names, times, the dishes: the designer's Bodoni Moda, roman, with its
 * optical-size axis — the hairlines of a 100px name come from it.
 *
 * No italic file, as in the designer's page: its Google Fonts link asks for the
 * roman only, so every `font-style: italic` ("royal", "du lendemain") is the
 * browser's slant of the roman, and that slanted roman is the look the designer
 * approved. Declaring the true italic here would set those words in a thinner,
 * narrower face than the reference. To get it, add the italic Latin subset to `src`.
 *
 * Self-hosted under a family name of its own, on purpose. This Next version keeps
 * a Google font's family name as it is ("Bodoni Moda"), so every theme that loads
 * that family adds `@font-face` rules to one document-wide family, and the app
 * imports every theme: the Maré Alta and Blanc Couture ones have no optical-size
 * axis, and when theirs win a Château title is set at the text size (wider, with
 * sturdier hairlines). A family nobody else declares cannot be overridden.
 *
 * The family is named by Next after this constant, so the constant's name is
 * what keeps it unique. Never rename it with `declarations: font-family`: the
 * production build applies that name to the `@font-face` rule only, while the
 * `--font-cr-display` variable keeps the constant's name — every Château title
 * was set in Arial online, though `next dev` showed it right.
 *
 * The file is the Latin subset of Bodoni Moda as Google Fonts serves it (SIL Open
 * Font License 1.1, © The Bodoni Moda Project Authors): the same variable font,
 * wght 400–900 and opsz 6–96.
 */
const chateauRoyalBodoni = localFont({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  src: "./font-files/bodoni-moda-latin.woff2",
  weight: "400 900",
  style: "normal",
  display: "swap",
  variable: "--font-cr-display",
});

/** The ampersand and the italic flourishes. */
const script = Pinyon_Script({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-cr-script",
});

/** Eyebrows, times, labels and form controls. */
const sans = Jost({
  // Every theme is registered on every invitation page: preloading would
  // fetch all of them. Only the faces the drawn theme uses are downloaded.
  preload: false,
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-cr-sans",
});

export const chateauRoyalFontVars = [chateauRoyalBodoni.variable, script.variable, sans.variable].join(" ");

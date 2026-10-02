import { Bodoni_Moda, Pinyon_Script } from "next/font/google";

/**
 * Fonts for the "Cabo Verde" theme.
 *
 * The designer's sheet names Apple-only faces — Didot / Bodoni 72 for headings and
 * Snell Roundhand for the script — and the cross-platform Times New Roman and
 * Arial for the rest. Apple devices keep exactly what was approved (the pipeline
 * leaves those names first) and these web faces follow them, so Windows and
 * Android no longer fall back to a plain serif for the headings.
 *
 * Apply `caboVerdeFontVars` on the theme root.
 */

/** Headings and the names: Didot's / Bodoni 72's stand-in. */
const display = Bodoni_Moda({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cv-display",
});

/** The italic flourishes: Snell Roundhand's stand-in. */
const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-cv-script",
});

export const caboVerdeFontVars = [display.variable, script.variable].join(" ");

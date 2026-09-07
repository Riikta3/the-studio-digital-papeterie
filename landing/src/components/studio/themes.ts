/**
 * Invitation theme catalogue, ported from the previous configurator.
 * Each entry drives the typographic preview shown on the theme step:
 * the card renders "Sophie & Pierre" with the theme's own fonts/colors.
 */

export type ThemeConfig = {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  bgGradient: string;
  coupleFont: string;
  coupleWeight?: string;
  coupleLetterSpacing?: string;
  coupleStyle?: "italic" | "normal";
  dateColor?: string;
  placeColor?: string;
  placeFont: string;
  placeStyle?: "italic" | "normal";
  placeExtra?: Record<string, string>;
};

/**
 * The three themes that actually ship, matching `components/home/themes.ts`
 * and the folders under `components/invitation/themes/`. The ids are the ones
 * the home page's theme dialog persists into the order, so a couple who
 * configured "Ciao Amore" there finds that same card already selected here.
 *
 * The catalogue previously listed five invented themes (Floral, Minimalist,
 * Boho, Royal, Travel) that no customer could open, and whose ids matched
 * nothing the home page or the invitation renderer knew about.
 */
export const THEMES: ThemeConfig[] = [
  {
    id: "ciao-amore",
    name: "Ciao Amore",
    description: "Soleil, dolce far niente et élégance italienne.",
    accentColor: "#2c3a8c",
    bgGradient: "linear-gradient(160deg, #fdf6dc, #f5d64e)",
    coupleFont: "'Playfair Display', Georgia, serif",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
    placeColor: "#4a58a8",
  },
  {
    id: "blanc-couture",
    name: "Blanc Couture",
    description: "L'élégance couture, épurée et lumineuse.",
    accentColor: "#2b2b2b",
    bgGradient: "linear-gradient(160deg, #fbfaf8, #e8e4dd)",
    coupleFont: "'Playfair Display', Georgia, serif",
    coupleWeight: "300",
    coupleLetterSpacing: "0.08em",
    dateColor: "#8a8a8a",
    placeFont: "system-ui, sans-serif",
    placeColor: "#a9a9a9",
    placeExtra: {
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      fontSize: "10px",
    },
  },
  {
    id: "belle-rive",
    name: "Belle Rive",
    description: "Douceur bord de mer, naturelle et aérienne.",
    accentColor: "#3f6d6f",
    bgGradient: "linear-gradient(160deg, #f2f8f7, #cfe3e0)",
    coupleFont: "Georgia, serif",
    coupleStyle: "italic",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
    placeColor: "#6f9b9c",
  },
];

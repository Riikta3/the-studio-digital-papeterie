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

export const THEMES: ThemeConfig[] = [
  {
    id: "theme-floral",
    name: "Floral",
    description: "Romantique et intemporel, inspiré par la nature.",
    accentColor: "#c97a90",
    bgGradient: "linear-gradient(160deg, #fdf6f0, #f0d9cc)",
    coupleFont: "'Playfair Display', Georgia, serif",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
  },
  {
    id: "theme-minimalist",
    name: "Minimalist",
    description: "L'élégance pure. Less is more.",
    accentColor: "#27272a",
    bgGradient: "linear-gradient(160deg, #f5f5f5, #e5e5e5)",
    coupleFont: "system-ui, sans-serif",
    coupleWeight: "300",
    coupleLetterSpacing: "0.08em",
    dateColor: "#888",
    placeFont: "system-ui, sans-serif",
    placeColor: "#bbb",
    placeExtra: {
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      fontSize: "10px",
    },
  },
  {
    id: "theme-boho",
    name: "Boho",
    description: "Chaleureux, libre et sauvage.",
    accentColor: "#a98467",
    bgGradient: "linear-gradient(160deg, #fdf0e5, #e8c99a)",
    coupleFont: "Georgia, serif",
    coupleStyle: "italic",
    placeFont: "Georgia, serif",
    placeStyle: "italic",
    placeColor: "#c4a882",
  },
  {
    id: "theme-royal",
    name: "Royal",
    description: "Sophistiqué et majestueux pour un mariage princier.",
    accentColor: "#1e3a8a",
    bgGradient: "linear-gradient(160deg, #eef2ff, #c7d4f5)",
    coupleFont: "Georgia, serif",
    placeFont: "Georgia, serif",
    placeColor: "#4a68c4",
  },
  {
    id: "theme-travel",
    name: "Travel",
    description: "Audacieux, vibrant et contemporain.",
    accentColor: "#be185d",
    bgGradient: "linear-gradient(160deg, #fff0f5, #f5c8db)",
    coupleFont: "'Montserrat', system-ui, sans-serif",
    coupleWeight: "800",
    placeFont: "'Montserrat', system-ui, sans-serif",
    placeColor: "#e879a8",
    placeExtra: {
      textTransform: "uppercase",
      letterSpacing: "0.2em",
      fontSize: "9px",
    },
  },
];

/**
 * Design tokens for the "Mediterranean Classy" invitation theme.
 *
 * Transcribed from the Figma design-system board (sections 01 → 06).
 * Hex values were read from the board's own labels and cross-checked by
 * sampling the swatches after converting the exports from Display P3 to sRGB.
 *
 * This file is the single source of truth for the theme. Components read from
 * it; the CSS custom properties in `shared/styles/globals.css` mirror it.
 */

/** 01 — Couleurs */
export const colors = {
  primary: {
    /** Deep bottle green — CTA text, borders, scroll indicator, countdown digits */
    default: "#1F592A",
    /** Olive/khaki — secondary accents */
    light: "#42452A",
  },
  secondary: {
    /** Warm brown — footer type, muted serif copy */
    warm: "#5D4B35",
  },
  neutral: {
    /** Page background */
    cream: "#F5F2EB",
    /** Warm sand — filled buttons, footer plate */
    beige: "#EADCCD",
    /** Sage grey — dividers, disabled states */
    muted: "#BABCAB",
    warmGray: "#C7BDB0",
    /** Input strokes */
    border: "#C9B8A8",
    light: "#E2E2E2",
    gray: "#D9D9D9",
    /** Body copy */
    nearBlack: "#181818",
    white: "#FFFFFF",
  },
} as const;

/** 02 — Typographie. Sizes are the Figma px values at the 1x mobile frame. */
export const typography = {
  "display/script": {
    family: "Ballet",
    weight: 400,
    size: 120,
    usage: "Prénoms du couple (hero)",
  },
  "heading/xl": {
    family: "Cormorant Garamond",
    weight: 600,
    size: 40,
    usage: "Titres de section (Programme, FAQ…)",
  },
  "heading/lg": {
    family: "Cormorant Garamond",
    weight: 600,
    size: 32,
    usage: "Titre carte lieu",
  },
  "body/serif-md": {
    family: "Cormorant Garamond",
    weight: 400,
    size: 18,
    usage: "Navigation, libellés de CTA",
  },
  "body/serif-sm": {
    family: "Cormorant Garamond",
    weight: 400,
    size: 16,
    usage: "Corps de texte serif, bouton observation",
  },
  "display/number-lg": {
    family: "Cormorant Infant",
    weight: 300,
    size: 40,
    usage: "Chiffres du countdown",
  },
  "display/time": {
    family: "Cormorant Infant",
    weight: 600,
    size: 40,
    usage: "Horaires du programme (17H00…)",
  },
  "body/sans-md": {
    family: "Jost",
    weight: 400,
    size: 18,
    usage: "Sous-titre hero, labels de section",
  },
  "body/sans-sm": {
    family: "Jost",
    weight: 400,
    size: 16,
    usage: "Corps principal (textes longs)",
  },
  "label/sans": {
    family: "Jost",
    weight: 400,
    size: 14,
    usage: "Labels et unités (JOURS, MIN…)",
  },
} as const;

/** Google Fonts needed by this theme. */
export const fontFamilies = {
  script: "Ballet",
  serif: "Cormorant Garamond",
  numeric: "Cormorant Infant",
  sans: "Jost",
} as const;

/** 03 — Ombres */
export const shadows = {
  /** Cartes, cartes route, map */
  card: "0 8px 23.2px 0 rgba(229, 213, 185, 0.33)",
  /** Options, hébergements */
  cardDark: "0 8px 23.2px 0 rgba(159, 132, 85, 0.33)",
} as const;

/** 04 — Atomes */
export const atoms = {
  routeButton: {
    variant: "outlined",
    borderColor: colors.primary.default,
    gap: 10,
    paddingX: 12,
  },
  optionsButton: {
    variant: "filled",
    background: colors.neutral.beige,
    gap: 10,
    paddingX: 24,
  },
  suggestButton: {
    variant: "outlined",
    borderColor: colors.neutral.white,
    gap: 10,
    paddingX: 24,
  },
  toggleButton: {
    shape: "circle",
    size: 40,
    radius: 58,
  },
  textInput: { width: 321, height: 28, stroke: "#BABCAB" },
  textArea: { width: 321, height: 80, stroke: "#BABCAB" },
  scrollIndicator: { stroke: colors.primary.default, radius: 97 },
} as const;

/**
 * Raster assets, converted from the Figma SVG exports to WebP.
 * Paths are relative to `landing/public`.
 */
export const assets = {
  // Papiers et cadres gaufrés
  paperEmbossLandscape: "/themes/mediterranean-classy/paper-emboss-landscape.webp",
  paperFramePortrait1: "/themes/mediterranean-classy/paper-frame-portrait-1.webp",
  paperFramePortrait2: "/themes/mediterranean-classy/paper-frame-portrait-2.webp",
  paperFrameSage: "/themes/mediterranean-classy/paper-frame-sage.webp",
  monogramEmboss: "/themes/mediterranean-classy/monogram-emboss.webp",
  /**
   * Interior of the portrait frame, cropped free of its ornate border: the
   * embossed lavender field the mock uses on almost every surface.
   */
  paperField: "/themes/mediterranean-classy/paper-field.webp",

  // Textures
  textureStoneWall: "/themes/mediterranean-classy/texture-stone-wall.webp",
  textureFooter: "/themes/mediterranean-classy/texture-footer.webp",
  /** Tileable noise — overlay at ~2% opacity, mix-blend-mode: darken */
  textureGrain: "/themes/mediterranean-classy/texture-grain.png",

  // Lieux et moments (aquarelles)
  venueDomaineTrinite: "/themes/mediterranean-classy/venue-domaine-trinite.webp",
  venueCeremonyArch: "/themes/mediterranean-classy/venue-ceremony-arch.webp",
  venueCeremonyAisle: "/themes/mediterranean-classy/venue-ceremony-aisle.webp",
  venueBanquetTable: "/themes/mediterranean-classy/venue-banquet-table.webp",
  venueOrangerie: "/themes/mediterranean-classy/venue-orangerie.webp",
  venuePool: "/themes/mediterranean-classy/venue-pool.webp",
  venueTennis: "/themes/mediterranean-classy/venue-tennis.webp",
  venuePetanque: "/themes/mediterranean-classy/venue-petanque.webp",
  photoHotelPool: "/themes/mediterranean-classy/photo-hotel-pool.webp",

  // Illustrations détourées
  iconChampagne: "/themes/mediterranean-classy/icon-champagne.webp",
  iconCocktails: "/themes/mediterranean-classy/icon-cocktails.webp",
  /** Full sheet of petals, kept for reference — decoration uses `petals` below. */
  flowersPetals: "/themes/mediterranean-classy/flowers-petals.webp",

  mapDomaineTrinite: "/themes/mediterranean-classy/map-domaine-trinite.webp",
} as const;

/**
 * Individual petals cut out of the source sheet. The mock scatters single large
 * petals across the page, so each one is its own asset. `petals[2]` is the only
 * one carrying green leaves — use it sparingly.
 */
export const petals = [
  "/themes/mediterranean-classy/petal-1.webp",
  "/themes/mediterranean-classy/petal-2.webp",
  "/themes/mediterranean-classy/petal-3.webp",
  "/themes/mediterranean-classy/petal-4.webp",
  "/themes/mediterranean-classy/petal-5.webp",
  "/themes/mediterranean-classy/petal-6.webp",
  "/themes/mediterranean-classy/petal-7.webp",
  "/themes/mediterranean-classy/petal-8.webp",
] as const;

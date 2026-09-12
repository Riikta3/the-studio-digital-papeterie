/**
 * The email design tokens.
 *
 * Deliberately a separate palette object rather than an import from
 * `tailwind-preset.js`: mail clients strip <style> blocks and know nothing
 * about Tailwind, so every rule has to ride inline on the element. Values here
 * are plain hex strings meant to be interpolated into `style=""`.
 *
 * Colours mirror the studio palette. Keep them in step with the preset by
 * hand — there is no build step between the two.
 */
export const COLORS = {
  /** Deep violet. Header fills, body text, primary buttons. */
  violet: "#4B3F72",
  /** Soft lavender. Hairline rules and dividers, always at low alpha. */
  lavande: "#B7AFD1",
  /** Warm butter. Type and logo on violet. */
  beurre: "#FFF9D6",
  /** Palest cream. Page background and inset panels. */
  creme: "#FFFDE8",
  /** White. The card the content sits on. */
  white: "#ffffff",
} as const;

/**
 * Alpha suffixes appended to a hex colour (`${COLORS.violet}99`).
 * 8-digit hex is understood by every client that matters and degrades to the
 * opaque colour in the ones that do not.
 */
export const ALPHA = {
  /** Secondary text — labels, captions. */
  muted: "99",
  /** Tertiary text — footers, fine print. */
  faint: "80",
  /** Hairlines. */
  hairline: "33",
  /** Type on violet, one step down from full beurre. */
  onVioletMuted: "b3",
} as const;

/**
 * Two families only. Georgia for display, because it is the one serif present
 * on effectively every desktop and mobile client; the system stack for
 * everything else, so body copy renders in the reader's native UI face.
 */
export const FONTS = {
  display: "Georgia,'Times New Roman',serif",
  sans: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
} as const;

/** Max width of the content card. 560px clears every mobile client. */
export const CARD_WIDTH = 560;

/**
 * Where the logo PNGs live. SVG is not an option — Gmail, Outlook and Apple
 * Mail all refuse to render it — so these are 3x PNGs displayed at 47x49.
 */
const ASSET_BASE =
  process.env.NEXT_PUBLIC_LANDING_URL ||
  "https://www.thestudiopapeteriedigitale.com";

export const LOGO = {
  /** Cream monogram, for the violet header. */
  cream: `${ASSET_BASE}/email/logo-cream.png`,
  /** Violet monogram, for cream and white grounds. */
  violet: `${ASSET_BASE}/email/logo-violet.png`,
  width: 47,
  height: 49,
} as const;

export const BRAND_NAME = "The Studio Digital Papeterie";

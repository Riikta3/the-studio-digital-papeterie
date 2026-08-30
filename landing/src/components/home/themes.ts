/**
 * Theme catalogues for the home page.
 *
 * There are two, because the page does two different things with them.
 *
 * `THEMES` — the real, published invitation themes. Each entry has an `id`
 * matching a folder in `src/components/invitation/themes/` and that theme's
 * manifest `id`, which is what builds the demo URL the phone mockup loads. A
 * mismatch shows an empty iframe, so keep them in step when a theme is added
 * or renamed.
 *
 * This file deliberately does NOT import the theme registry: a manifest holds
 * its theme's `Root` component, and the home page is a client component —
 * importing it here would pull every theme's markup, CSS and fonts into the
 * home bundle for the sake of a name and a thumbnail.
 *
 * `HERO_CARDS` — the decorative fan of cards behind the headline. Pure
 * ornament: no card is clickable and none loads a demo, so these stay as
 * artwork with evocative names rather than being tied to shipped themes.
 */

export const THEMES = [
  {
    id: "ciao-amore",
    name: "Ciao Amore",
    image: "/themes/ciao-amore/cover.webp",
  },
] as const;

export type Theme = (typeof THEMES)[number];

/** The demo route for a theme, as loaded in the phone mockup. */
export function themeDemoPath(locale: string, themeId: string): string {
  return `/${locale}/invitation/demo/${themeId}`;
}

/**
 * Cards for the hero fan. The count matters: `HeroCarousel` centres the fan on
 * `REFERENCE_INDEX`, so the list must stay at least that long.
 */
export const HERO_CARDS = [
  { name: "Amalfi", image: "/images/invitation-amalfi.png" },
  { name: "Venise", image: "/images/invitation-venise.png" },
  { name: "Provence", image: "/images/invitation-provence.png" },
  { name: "Toscane", image: "/images/invitation-toscane.png" },
  { name: "Riviera", image: "/images/invitation-riviera.png" },
  { name: "Capri", image: "/images/invitation-capri.png" },
] as const;

export type HeroCard = (typeof HERO_CARDS)[number];

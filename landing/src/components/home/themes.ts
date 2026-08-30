/**
 * The invitation themes shown on the home page — the hero fan and the phone
 * mockup's carousel both read this list.
 *
 * Every entry is a theme that actually ships. `id` matches a folder in
 * `src/components/invitation/themes/` and that theme's manifest `id`, which is
 * what builds the demo URL the mockup loads; a mismatch shows an empty iframe,
 * so keep them in step when a theme is added or renamed. `image` is a real
 * screenshot of the theme's own demo, generated with `npm run themes:shoot`.
 *
 * The page used to advertise six invented names (Amalfi, Venise, Provence…)
 * over stock artwork, none of which corresponded to anything a customer could
 * open. Showing only shipped themes means the fan, the carousel and the mockup
 * finally agree with each other.
 *
 * This file deliberately does NOT import the theme registry: a manifest holds
 * its theme's `Root` component, and the home page is a client component —
 * importing it here would pull every theme's markup, CSS and fonts into the
 * home bundle for the sake of a name and a thumbnail.
 */

export const THEMES = [
  {
    id: "ciao-amore",
    name: "Ciao Amore",
    image: "/themes/ciao-amore/cover.webp",
  },
  {
    id: "blanc-couture",
    name: "Blanc Couture",
    image: "/themes/blanc-couture/cover.webp",
  },
  {
    id: "belle-rive",
    name: "Belle Rive",
    image: "/themes/belle-rive/cover.webp",
  },
] as const;

export type Theme = (typeof THEMES)[number];

/** The demo route for a theme, as loaded in the phone mockup. */
export function themeDemoPath(locale: string, themeId: string): string {
  return `/${locale}/invitation/demo/${themeId}`;
}

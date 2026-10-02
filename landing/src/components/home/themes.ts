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
 * `statusBar` is the colour of the top edge of the theme's first screen (read
 * from its cover) and the text that reads on it: the phone mockup draws its
 * status bar on that colour, above the invitation rather than over it, the way
 * a browser does — over it, the white clock collided with each theme's own
 * top line and vanished on the light ones.
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
    statusBar: { background: "#fefdf9", text: "dark" },
  },
  {
    id: "blanc-couture",
    name: "Blanc Couture",
    image: "/themes/blanc-couture/cover.webp",
    statusBar: { background: "#efefef", text: "dark" },
  },
  {
    id: "belle-rive",
    name: "Belle Rive",
    image: "/themes/belle-rive/cover.webp",
    statusBar: { background: "#efe5d6", text: "dark" },
  },
  {
    id: "mare-alta",
    name: "Maré Alta",
    image: "/themes/mare-alta/cover.webp",
    statusBar: { background: "#d6cbbc", text: "dark" },
  },
  {
    id: "chateau-royal",
    name: "Château Royal",
    image: "/themes/chateau-royal/cover.webp",
    statusBar: { background: "#57535b", text: "light" },
  },
  {
    id: "cabo-verde",
    name: "Cabo Verde",
    image: "/themes/cabo-verde/cover.webp",
    statusBar: { background: "#ee9c98", text: "dark" },
  },
] as const;

export type Theme = (typeof THEMES)[number];

/** The demo route for a theme, as loaded in the phone mockup. */
export function themeDemoPath(locale: string, themeId: string): string {
  return `/${locale}/invitation/demo/${themeId}`;
}

/**
 * A card announcing that more themes are on the way, shown after the real ones.
 *
 * It is not a theme: it has no demo to load and nothing to select, so it is
 * kept out of `THEMES` rather than being given a fake id. Both carousels append
 * it themselves and skip it when resolving a selection — an entry in `THEMES`
 * would otherwise point the phone mockup at a route that does not exist.
 */
export const UPCOMING_CARD = { kind: "upcoming" } as const;

export const THEMES = [
  { name: "Amalfi", image: "/images/invitation-amalfi.png" },
  { name: "Venise", image: "/images/invitation-venise.png" },
  { name: "Provence", image: "/images/invitation-provence.png" },
  { name: "Toscane", image: "/images/invitation-toscane.png" },
  { name: "Riviera", image: "/images/invitation-riviera.png" },
  { name: "Capri", image: "/images/invitation-capri.png" },
] as const;

export type Theme = (typeof THEMES)[number];

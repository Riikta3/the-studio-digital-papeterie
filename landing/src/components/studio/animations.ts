/**
 * Entrance animation catalogue, ported from the previous configurator.
 * Variant names/descriptions stay in French for now — only the category
 * labels are translated (see the StudioAnimation messages).
 */

export type AnimationVariant = { id: string; name: string; desc: string };
export type AnimationCategory = { id: string; variants: AnimationVariant[] };

export const ANIMATION_CATEGORIES: AnimationCategory[] = [
  {
    id: "envelope",
    variants: [
      { id: "envelope-classic", name: "Classique", desc: "Ouverture élégante et sobre" },
      { id: "envelope-kraft", name: "Kraft", desc: "Texture papier naturel" },
      { id: "envelope-luxury", name: "Luxe", desc: "Fermeture cire, finition premium" },
      { id: "envelope-vintage", name: "Vintage", desc: "Style rétro avec cachet de cire" },
    ],
  },
  {
    id: "door",
    variants: [
      { id: "door-royal", name: "Royal", desc: "Grande porte dorée majestueuse" },
      { id: "door-floral", name: "Floral", desc: "Porte ornée de fleurs printanières" },
      { id: "door-classic", name: "Classique", desc: "Porte en bois sobre et élégante" },
      { id: "door-authentic", name: "Authentique", desc: "Porte rustique en bois brut" },
      { id: "door-travel", name: "Voyage", desc: "Porte vitrée contemporaine" },
    ],
  },
  {
    id: "curtain",
    variants: [
      { id: "curtain-velvet", name: "Velours", desc: "Rideau de velours bordeaux" },
      { id: "curtain-linen", name: "Lin", desc: "Tissu naturel aérien" },
      { id: "curtain-silk", name: "Soie", desc: "Reflets soyeux et lumineux" },
    ],
  },
  {
    id: "book",
    variants: [
      { id: "book-leather", name: "Cuir", desc: "Couverture en cuir gravé" },
      { id: "book-floral", name: "Floral", desc: "Illustrations botaniques" },
      { id: "book-travel", name: "Voyage", desc: "Couverture épurée et graphique" },
    ],
  },
  {
    id: "floral",
    variants: [
      { id: "floral-roses", name: "Roses", desc: "Pétales de rose qui s'envolent" },
      { id: "floral-wildflower", name: "Champêtre", desc: "Fleurs des champs printanières" },
      { id: "floral-peony", name: "Pivoines", desc: "Bouquet de pivoines romantiques" },
    ],
  },
];

/** Only these variants have real media in public/videos/animation/. */
const ASSET_MAP: Record<string, { category: string; variant: string; slug: string }> = {
  "door-floral": { category: "doors", variant: "floral", slug: "porte-florale" },
  "door-royal": { category: "doors", variant: "royal", slug: "porte-royal" },
};

export function getAnimationPreview(animationId: string): string | null {
  const e = ASSET_MAP[animationId];
  if (!e) return null;
  return `/videos/animation/${e.category}/${e.variant}/preview/animation-${e.slug}-preview.png`;
}

export function getAnimationDesktopWebp(animationId: string): string | null {
  const e = ASSET_MAP[animationId];
  if (!e) return null;
  return `/videos/animation/${e.category}/${e.variant}/desktop/animation-${e.slug}-desktop.webp`;
}

export function getAnimationMobileVideo(animationId: string): string | null {
  const e = ASSET_MAP[animationId];
  if (!e) return null;
  return `/videos/animation/${e.category}/${e.variant}/mobile/animation-${e.slug}-mobile.mp4`;
}

export function hasAnimationMedia(animationId: string): boolean {
  return animationId in ASSET_MAP;
}

import { Globe, Music, Palette, Video } from "lucide-react";

/**
 * Language and extra catalogues, ported from the previous configurator.
 * Prices stay in sync with EXTRA_PRICES / LANGUAGE_PRICE in the order store.
 */

export const ALL_LANGUAGES = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "Anglais" },
  { code: "es", flag: "🇪🇸", name: "Espagnol" },
  { code: "de", flag: "🇩🇪", name: "Allemand" },
  { code: "it", flag: "🇮🇹", name: "Italien" },
  { code: "pt", flag: "🇧🇷", name: "Portugais" },
  { code: "ar", flag: "🇸🇦", name: "Arabe" },
  { code: "zh", flag: "🇨🇳", name: "Chinois" },
  { code: "ja", flag: "🇯🇵", name: "Japonais" },
];

/** The extra whose price follows the wedding date (`domainPrice`), not a fixed figure. */
export const CUSTOM_DOMAIN_EXTRA = "custom-domain";

export const EXTRAS: {
  id: string;
  icon: typeof Globe;
  name: string;
  desc: string;
  /** Null for the custom domain: priced by `domainPrice(years)`, see `useDomainYears`. */
  price: number | null;
}[] = [
  {
    id: "custom-music",
    icon: Music,
    name: "Musique personnalisée",
    desc: "Ajoutez votre chanson préférée à l'ambiance de votre site.",
    price: 10,
  },
  {
    id: "custom-illustration",
    icon: Palette,
    name: "Illustration sur mesure",
    desc: "Un portrait illustré de vous deux réalisé par nos artistes.",
    price: 45,
  },
  {
    id: "animated-video",
    icon: Video,
    name: "Vidéo animée",
    desc: "Intro vidéo animée pour accueillir vos invités avec style.",
    price: 55,
  },
  {
    id: CUSTOM_DOMAIN_EXTRA,
    icon: Globe,
    name: "Domaine personnalisé",
    desc: "sophie-et-pierre.com au lieu du lien générique.",
    price: null,
  },
];

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

export const EXTRAS = [
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
    id: "custom-domain",
    icon: Globe,
    name: "Domaine personnalisé",
    desc: "sophie-et-pierre.fr au lieu du lien générique.",
    price: 65,
  },
];

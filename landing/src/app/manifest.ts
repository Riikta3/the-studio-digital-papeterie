import type { MetadataRoute } from "next";

// A metadata route rather than the static public/site.webmanifest that came
// with the generated icon set: that file shipped with empty `name` and
// `short_name` (so an installed shortcut would have had no label) and a white
// theme_color that is not a brand colour. Lives at src/app/ so the URL stays
// /manifest.webmanifest with no locale prefix.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Studio Digital Papeterie",
    short_name: "The Studio",
    description:
      "Créez votre faire-part de mariage digital : invitation élégante, RSVP intégré et toutes les informations de votre mariage au même endroit.",
    start_url: "/",
    display: "standalone",
    // Brand tokens from shared/tailwind-preset.js: `studio.violet` for the
    // browser chrome, `studio.beurre` behind the splash screen — the same
    // pairing the hero uses.
    theme_color: "#4B3F72",
    background_color: "#FFF9D6",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        // `maskable` so Android can crop it to the launcher's icon shape
        // instead of letterboxing it inside a white rounded square.
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

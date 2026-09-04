import type { MetadataRoute } from "next";

// Mirrors the landing app's manifest, with the names that belong to the
// back-office: a couple who installs this to their home screen is opening
// their own dashboard, not the marketing site.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Studio — Espace mariés",
    short_name: "Espace mariés",
    description:
      "Suivez vos réponses RSVP, votre liste d'invités et votre plan de table.",
    // The locale prefix is deliberate: "/" would bounce through the proxy's
    // locale redirect on every cold launch of the installed app.
    start_url: "/fr",
    display: "standalone",
    // Brand tokens from shared/tailwind-preset.js, same pairing as landing.
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
        // `maskable` so Android crops it to the launcher's icon shape rather
        // than letterboxing it inside a white rounded square.
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

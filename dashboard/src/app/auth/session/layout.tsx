import type { Metadata } from "next";
import { Libre_Caslon_Display, Urbanist } from "next/font/google";

import "../../globals.css";

/**
 * The document for the sign-in hand-off, which sits outside `[locale]`.
 *
 * Same reason as `update-password/layout.tsx`: the link arrives from an email
 * before any locale is resolved, and the root layout is a pass-through (see
 * `../../layout.tsx`) because `[locale]` renders its own `<html>`. A page
 * without a document of its own fails the production build outright.
 *
 * The fonts are declared again rather than imported: `next/font` returns a
 * per-call class name, so each layout has to apply its own.
 */

const libreCaslonDisplay = Libre_Caslon_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400"],
  display: "swap",
});

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Studio | Connexion",
  // Reached only from an email link, and the URL carries session material in
  // its fragment. Nothing here should ever be indexed or followed.
  robots: { index: false, follow: false },
};

export default function AuthSessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${libreCaslonDisplay.variable} ${urbanist.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

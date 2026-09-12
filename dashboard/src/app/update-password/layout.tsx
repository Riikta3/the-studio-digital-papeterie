import type { Metadata } from "next";
import { Libre_Caslon_Display, Urbanist } from "next/font/google";

import "../globals.css";

/**
 * The document for the password form, which sits outside `[locale]`.
 *
 * Supabase's recovery link lands here before any locale is resolved, so the
 * page cannot use the localized layout — and the root layout is a pass-through
 * (see `../layout.tsx`), because that one is shared with `[locale]`, which
 * renders its own `<html>`. So this route supplies its own.
 *
 * The fonts are declared again rather than imported from the localized layout:
 * `next/font` returns a per-call class name, and each layout has to apply its
 * own. Keeping the same two faces is what makes this page look like the rest
 * of the dashboard.
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
  title: "The Studio | Nouveau mot de passe",
  // This page is reached from an email link and has nothing to offer a
  // crawler; keeping it out of the index also keeps the recovery URL from
  // being surfaced anywhere it should not be.
  robots: { index: false, follow: false },
};

export default function UpdatePasswordLayout({
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

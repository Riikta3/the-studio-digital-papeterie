import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import {
  Cinzel,
  Cormorant_Garamond,
  Epilogue,
  Inter,
  Playfair_Display,
} from "next/font/google";
import type { ReactNode } from "react";

import { CookieConsent } from "@/components/cookie-consent";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cinzel",
});

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-epilogue",
});

export const metadata: Metadata = {
  title: "Meet My Weeding",
  description: "Faire-part digitaux haut de gamme",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${cormorant.variable} ${cinzel.variable} ${epilogue.variable}`}
    >
      <body
        className='min-h-screen bg-background text-foreground bg-noise'
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute='class'
            defaultTheme='theme-floral'
            enableSystem={false}
            themes={[
              "theme-floral",
              "theme-minimalist",
              "theme-boho",
              "theme-royal",
              "theme-modern",
            ]}
          >
            {children}
            <CookieConsent />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

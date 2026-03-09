import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import { CookieConsent } from "@/components/cookie-consent";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";

export const metadata: Metadata = {
  title: "The Studio Digital Papeterie",
  description: "Faire-part digitaux haut de gamme",
};

import { Toaster } from "@shared/components/ui/sonner";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
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
        <Toaster />
        <SpeedInsights />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

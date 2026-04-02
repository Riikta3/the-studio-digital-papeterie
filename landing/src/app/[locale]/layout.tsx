import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

import { ConditionalAnalytics } from "@/components/conditional-analytics";
import { CookieConsent } from "@/components/cookie-consent";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";

export const metadata: Metadata = {
  title: "The Studio Digital Papeterie",
  description: "Faire-part digital haut de gamme",
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
          "theme-travel",
        ]}
      >
        {children}
        <CookieConsent />
        <ConditionalAnalytics />
        <Toaster />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}

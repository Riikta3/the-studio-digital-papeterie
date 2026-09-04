import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { routing } from "@/navigation";

import "../globals.css";

// Canonical origin for absolute URLs in <link rel="canonical">, hreflang and
// Open Graph. Overridable per environment so preview deploys don't advertise
// production URLs.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://the-studio-digital-papeterie.vercel.app";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  // hreflang map: every locale points at its own prefixed route so Google
  // serves the right language instead of picking one and ignoring the rest.
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `${SITE_URL}/${l}`]),
  );

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(", "),
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        ...languages,
        "x-default": `${SITE_URL}/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "The Studio Digital Papeterie",
      locale,
      url: `${SITE_URL}/${locale}`,
      title: t("ogTitle"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("description"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function LocaleLayout({
  children,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { getSiteUrl } from "@/lib/site";
import { routing } from "@/navigation";

import "../globals.css";

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
    routing.locales.map((l) => [l, `${getSiteUrl()}/${l}`]),
  );

  return {
    metadataBase: new URL(getSiteUrl()),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `${getSiteUrl()}/${locale}`,
      languages: {
        ...languages,
        "x-default": `${getSiteUrl()}/${routing.defaultLocale}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "The Studio Digital Papeterie",
      locale,
      // Tells Facebook and LinkedIn the other eight versions exist, so a
      // share picks the reader's language rather than the sharer's.
      alternateLocale: routing.locales.filter((l) => l !== locale),
      url: `${getSiteUrl()}/${locale}`,
      title: t("ogTitle"),
      description: t("description"),
      // `images` is filled in by Next from the `opengraph-image.tsx` file
      // convention in this segment — declaring it here would override it.
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
    // Declared explicitly rather than relying on file-convention icons: the
    // set lives in public/ (favicon.ico there is also what bare-/favicon.ico
    // requests hit), and the .ico carries the 48px variant browsers prefer
    // for bookmarks and pinned tabs.
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      title: "The Studio",
      capable: true,
      statusBarStyle: "default",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  // `lang`/`dir` are stamped by the root layout, which reads the locale off
  // the `x-pathname` header the proxy forwards. They used to be patched here
  // by a client script, which left the SSR markup — the only thing crawlers
  // and screen readers see — claiming French on every locale.
  return (
    <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
  );
}

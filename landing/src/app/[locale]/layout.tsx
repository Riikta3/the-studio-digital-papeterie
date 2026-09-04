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
    keywords: t("keywords").split(", "),
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
      url: `${getSiteUrl()}/${locale}`,
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

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <NextIntlClientProvider messages={messages}>
      {/* `lang`/`dir` belong on <html>, owned by the root layout — which
          cannot see this segment's params, and must not call headers() or the
          whole app loses static rendering. Stamped from here instead, inline
          and synchronous so it lands before first paint: RTL text laid out as
          LTR and then reflowed is a visible jump. The SSR HTML therefore
          carries the default locale; `generateMetadata` already emits the
          correct hreflang/canonical for crawlers. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            `document.documentElement.lang=${JSON.stringify(locale)};` +
            `document.documentElement.dir=${JSON.stringify(dir)}`,
        }}
      />
      {children}
    </NextIntlClientProvider>
  );
}

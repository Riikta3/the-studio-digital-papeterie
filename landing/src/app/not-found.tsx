import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";

import { NotFoundView } from "@/components/home/NotFoundView";
import { routing } from "@/navigation";

import "./globals.css";

export const metadata: Metadata = {
  title: "Page introuvable — The Studio Papeterie Digitale",
  robots: { index: false, follow: false },
  // Repeated here rather than inherited: this route sits outside `[locale]/`,
  // so it does not pick up that layout's metadata, and a 404 with a blank tab
  // icon looks like a broken site rather than a missing page.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// Rendered for any URL that matches no route, including localized ones:
// `[locale]/not-found.tsx` only covers `notFound()` calls from a real page.
// The locale therefore has to come from the request path, not from params.
async function resolveLocale() {
  const headerList = await headers();
  const pathname =
    headerList.get("x-pathname") ?? headerList.get("x-invoke-path") ?? "";
  const segment = pathname.split("/").filter(Boolean)[0];

  return (routing.locales as readonly string[]).includes(segment ?? "")
    ? (segment as (typeof routing.locales)[number])
    : routing.defaultLocale;
}

export default async function RootNotFound() {
  const locale = await resolveLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotFoundView />
    </NextIntlClientProvider>
  );
}

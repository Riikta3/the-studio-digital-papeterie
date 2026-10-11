import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { headers } from "next/headers";

import { CustomDomainNotFound } from "@/components/custom-domain/CustomDomainNotFound";
import { NotFoundViewLoader } from "@/components/home/NotFoundViewLoader";
import { isCoupleDomainRequest } from "@/lib/custom-domain-request";
import { CUSTOM_DOMAIN_NOT_FOUND_COPY } from "@/lib/custom-domain-routing";
import { routing } from "@/navigation";

import "./globals.css";

const ICONS: Metadata["icons"] = {
  icon: [
    { url: "/favicon.ico", sizes: "any" },
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
  ],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
};

// A not-found file's `generateMetadata` is resolved like a page's in Next 16,
// so the title can follow the host: on a couple's domain it does not name the
// shop.
export async function generateMetadata(): Promise<Metadata> {
  const title = (await isCoupleDomainRequest())
    ? CUSTOM_DOMAIN_NOT_FOUND_COPY.title
    : "Page introuvable — The Studio Papeterie Digitale";

  return {
    title,
    robots: { index: false, follow: false },
    // Repeated here rather than inherited: this route sits outside
    // `[locale]/`, so it does not pick up that layout's metadata, and a 404
    // with a blank tab icon looks like a broken site rather than a missing
    // page.
    icons: ICONS,
  };
}

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
  // A couple's domain reaches this page through a path with a dot, which the
  // proxy never sees (`/foo.bar`): it gets the bare page, not the shop's 404.
  if (await isCoupleDomainRequest()) return <CustomDomainNotFound />;

  const locale = await resolveLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NotFoundViewLoader />
    </NextIntlClientProvider>
  );
}

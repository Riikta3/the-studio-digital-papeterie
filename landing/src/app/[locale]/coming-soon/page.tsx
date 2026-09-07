import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ComingSoonView } from "@/components/home/ComingSoonView";
import { routing } from "@/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ComingSoon" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    // A teaser page must not compete with the homepage in search results, and
    // it will be removed once the feature it announces ships.
    robots: { index: false, follow: true },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Read on the server so the page stays statically rendered and the year in
  // the footer never drifts, the same way `home/Footer.tsx` does it.
  return <ComingSoonView year={new Date().getFullYear()} />;
}

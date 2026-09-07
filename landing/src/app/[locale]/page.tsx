import { Atelier } from "@/components/home/Atelier";
import { Dashboard } from "@/components/home/Dashboard";
import { Faq } from "@/components/home/Faq";
import { FinalCtaAndFooter } from "@/components/home/FinalCtaAndFooter";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { JourJ } from "@/components/home/JourJ";
import { Preview } from "@/components/home/Preview";
import { Pricing } from "@/components/home/Pricing";
import { ScrollToHash } from "@/components/home/ScrollToHash";
import { ScrollToTop } from "@/components/home/ScrollToTop";
import { StructuredData } from "@/components/seo/StructuredData";
import { WhyUs } from "@/components/home/WhyUs";
import { buildAlternates, buildOpenGraph } from "@/lib/seo-metadata";
import { routing } from "@/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

/**
 * The homepage owns its canonical, like every other indexable page.
 *
 * It used to inherit one from the `[locale]` layout, which happened to be
 * correct here and wrong everywhere else. The layout no longer declares one.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    alternates: buildAlternates(locale, ""),
    openGraph: buildOpenGraph({
      locale,
      path: "",
      title: t("ogTitle"),
      description: t("description"),
    }),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <StructuredData locale={locale} />
      <Hero />
      <HowItWorks />
      <Preview />
      <WhyUs />
      <Pricing />
      <Atelier />
      <Dashboard />
      <JourJ />
      <Faq />
      <FinalCtaAndFooter />
      <ScrollToHash />
      <ScrollToTop />
    </main>
  );
}

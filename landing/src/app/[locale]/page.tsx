import { Atelier } from "@/components/home/Atelier";
import { Dashboard } from "@/components/home/Dashboard";
import { Faq } from "@/components/home/Faq";
import { FinalCtaAndFooter } from "@/components/home/FinalCtaAndFooter";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { JourJ } from "@/components/home/JourJ";
import { Preview } from "@/components/home/Preview";
import { Pricing } from "@/components/home/Pricing";
import { ScrollToTop } from "@/components/home/ScrollToTop";
import { WhyUs } from "@/components/home/WhyUs";
import { routing } from "@/navigation";
import { setRequestLocale } from "next-intl/server";

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
      <ScrollToTop />
    </main>
  );
}

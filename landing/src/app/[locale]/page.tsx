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

export default function HomePage() {
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

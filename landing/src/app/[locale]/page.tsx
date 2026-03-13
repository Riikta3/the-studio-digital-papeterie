import { HowItWorks } from "@/components/landing/how-it-works";
import { Catalogue } from "@/components/landing/catalogue";
import { PricingComparison } from "@/components/landing/pricing-comparison";
import { ValueCards } from "@/components/landing/value-cards";
import { Customization } from "@/components/landing/customization";
import { Testimonials } from "@/components/landing/testimonials";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export default function Home() {
  return (
    <main className="min-h-screen w-full relative">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Catalogue />
      <PricingComparison />
      <ValueCards />
      <Customization />
      <Testimonials />
      <Footer />
      <ScrollToTop />
    </main>
  );
}

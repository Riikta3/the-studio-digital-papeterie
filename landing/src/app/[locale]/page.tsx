import { HowItWorks } from "@/components/landing/how-it-works";
import { ProductDemo } from "@/components/landing/product-demo";
import { PricingComparison } from "@/components/landing/pricing-comparison";
import { ValueCards } from "@/components/landing/value-cards";
import { Customization } from "@/components/landing/customization";
import { Testimonials } from "@/components/landing/testimonials";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export default function Home() {
  return (
    <main className="min-h-screen w-full relative">
      <Navbar />
      <Hero />
      <ProductDemo />
      <HowItWorks />
      <PricingComparison />
      <ValueCards />
      <Customization />
      <Testimonials />
      <FAQ />
      <Footer />
      <ScrollToTop />
    </main>
  );
}

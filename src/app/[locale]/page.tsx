import { About } from "@/components/landing/about";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Examples } from "@/components/landing/examples";
import { FAQ } from "@/components/landing/faq";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { PricingPreview } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

export default function Home() {
  return (
    <main className='min-h-screen w-full relative'>
      <Navbar />

      {/* 1. La Promesse (Hero) */}
      <Hero />

      {/* 2. La Preuve Visuelle (Examples - Themes) : On seduit d'abord */}
      <Examples />

      {/* 3. L'Argumentaire Rationnel (Features) : On rassure ensuite */}
      <Features />

      {/* 4. La Facilité d'Usage (Dashboard) : On montre "l'envers du décor" */}
      <DashboardPreview />

      {/* 5. La Preuve Sociale (Testimonials) */}
      <Testimonials />

      {/* 6. L'Histoire (About) */}
      <About />

      {/* 7. L'Offre (Pricing) */}
      <PricingPreview />

      {/* 8. Les Derniers Doutes (FAQ) */}
      <FAQ />

      <Footer />
      <ScrollToTop />
    </main>
  );
}

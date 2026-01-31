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
      <Hero />
      <Features />
      <DashboardPreview />
      <Examples />
      <Testimonials />
      <About />
      <PricingPreview />
      <FAQ />
      <Footer />
      <ScrollToTop />
    </main>
  );
}

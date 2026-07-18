import { Atelier } from "@/components/home/Atelier";
import { Dashboard } from "@/components/home/Dashboard";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Preview } from "@/components/home/Preview";
import { Pricing } from "@/components/home/Pricing";
import { Testimonials } from "@/components/home/Testimonials";
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
      <Testimonials />
    </main>
  );
}

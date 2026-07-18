import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Preview } from "@/components/home/Preview";
import { WhyUs } from "@/components/home/WhyUs";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Preview />
      <WhyUs />
    </main>
  );
}

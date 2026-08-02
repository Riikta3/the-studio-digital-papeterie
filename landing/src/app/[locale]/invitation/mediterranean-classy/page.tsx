import type { Metadata, Viewport } from "next";

import { AccessSection } from "@/components/invitation/theme-mediterranean-classy/AccessSection";
import { AccommodationSection } from "@/components/invitation/theme-mediterranean-classy/AccommodationSection";
import { CountdownSection } from "@/components/invitation/theme-mediterranean-classy/CountdownSection";
import { FaqSection } from "@/components/invitation/theme-mediterranean-classy/FaqSection";
import { FooterSection } from "@/components/invitation/theme-mediterranean-classy/FooterSection";
import { HeroSection } from "@/components/invitation/theme-mediterranean-classy/HeroSection";
import { PlaylistSection } from "@/components/invitation/theme-mediterranean-classy/PlaylistSection";
import { ProgrammeSection } from "@/components/invitation/theme-mediterranean-classy/ProgrammeSection";
import { RsvpSection } from "@/components/invitation/theme-mediterranean-classy/RsvpSection";
import { mediterraneanFontVars } from "@/components/invitation/theme-mediterranean-classy/fonts";
import { GrainOverlay } from "@/components/invitation/theme-mediterranean-classy/ui";
import { MEDITERRANEAN_DEMO as D } from "@/lib/mediterranean-demo-data";

// Static preview of the "Mediterranean Classy" theme, rendered at the mock's
// 402px mobile frame. No data fetching — everything comes from the demo dataset.
export async function generateViewport(): Promise<Viewport> {
  return { width: 402, initialScale: 1 };
}

export const metadata: Metadata = {
  title: "Élégance méditerranéenne — The Studio",
  robots: { index: false, follow: false },
};

export default function MediterraneanClassyPage() {
  return (
    // Mobile-first: base styles reproduce the 402px mock, then each section
    // widens and its type scales at md/lg (see the `Container` primitive).
    <main className={`${mediterraneanFontVars} relative min-h-screen bg-mc-cream`}>
      <GrainOverlay />

      <div>
        <HeroSection
          intro={D.intro}
          partner1={D.partner1}
          partner2={D.partner2}
          dateLabel={D.weddingDateLabel}
        />
        <CountdownSection weddingDateISO={D.weddingDateISO} />
        <ProgrammeSection days={D.programme} />
        <AccessSection venue={D.venue} />
        <AccommodationSection items={D.accommodations} />
        <PlaylistSection
          intro={D.playlist.intro}
          suggestions={D.playlist.suggestions}
        />
        <FaqSection entries={D.faq} />
        <RsvpSection rsvp={D.rsvp} />
        <FooterSection
          image={D.footer.image}
          title={D.footer.title}
          partner1={D.partner1}
          partner2={D.partner2}
          dateLabel={D.weddingDateLabel}
        />
      </div>
    </main>
  );
}

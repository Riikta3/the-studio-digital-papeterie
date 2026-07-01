import React from "react";
import { ModuleRenderer } from "./ModuleRenderer";
import { ModulesWrapper } from "./ModulesWrapper";
import { ScrollToTop } from "./ScrollToTop";
import { InvitationFooter as BohoFooter } from "./themes/theme-boho/InvitationFooter";
import { InvitationHero as BohoHero } from "./themes/theme-boho/InvitationHero";
import { InvitationFooter as FloralFooter } from "./themes/theme-floral/InvitationFooter";
import { InvitationHero as FloralHero } from "./themes/theme-floral/InvitationHero";
import { InvitationFooter as MinimalistFooter } from "./themes/theme-minimalist/InvitationFooter";
import { InvitationHero as MinimalistHero } from "./themes/theme-minimalist/InvitationHero";
import { InvitationFooter as RoyalFooter } from "./themes/theme-royal/InvitationFooter";
import { InvitationHero as RoyalHero } from "./themes/theme-royal/InvitationHero";
import { InvitationFooter as TravelFooter } from "./themes/theme-travel/InvitationFooter";
import { InvitationHero as TravelHero } from "./themes/theme-travel/InvitationHero";

const THEME_BG: Record<string, string> = {
  "theme-travel": "#FDFDFA",
};

const HEROES: Record<string, React.ComponentType<any>> = {
  "theme-minimalist": MinimalistHero,
  "theme-floral": FloralHero,
  "theme-boho": BohoHero,
  "theme-royal": RoyalHero,
  "theme-travel": TravelHero,
};

const FOOTERS: Record<string, React.ComponentType<any>> = {
  "theme-minimalist": MinimalistFooter,
  "theme-floral": FloralFooter,
  "theme-boho": BohoFooter,
  "theme-royal": RoyalFooter,
  "theme-travel": TravelFooter,
};

interface ThemedInvitationLayoutProps {
  themeId: string;
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
  profile: {
    first_name: string;
    partner_name: string;
    wedding_date?: string | null;
  };
  modules: string[];
  weddingId: string;
  siteId: string;
  extras?: any;
  isDemo?: boolean;
}

export async function ThemedInvitationLayout({
  themeId,
  firstName,
  partnerName,
  weddingDate,
  profile,
  modules,
  weddingId,
  siteId,
  extras,
  isDemo,
}: ThemedInvitationLayoutProps) {
  const Hero = HEROES[themeId] ?? MinimalistHero;
  const Footer = FOOTERS[themeId] ?? MinimalistFooter;
  const bg = THEME_BG[themeId] ?? "";

  return (
    <div
      className={`font-sans ${themeId}`}
      style={bg ? { backgroundColor: bg } : {}}
    >
      <Hero
        firstName={firstName}
        partnerName={partnerName}
        weddingDate={weddingDate}
      />
      <ModulesWrapper>
        <div
          id='modules'
          style={bg ? { backgroundColor: bg } : {}}
        >
          <main className='max-w-4xl mx-auto py-3 px-4 relative z-10'>
            <ModuleRenderer
              modules={modules}
              weddingId={weddingId}
              siteId={siteId}
              weddingDate={weddingDate}
              extras={extras}
              partner1={firstName}
              partner2={partnerName}
              isDemo={isDemo}
              themeId={themeId}
            />
          </main>
        </div>
      </ModulesWrapper>
      <Footer profile={profile} />
      <ScrollToTop />
    </div>
  );
}

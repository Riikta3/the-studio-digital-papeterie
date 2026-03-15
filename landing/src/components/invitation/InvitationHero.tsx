"use client";

import { useInvitationDemo } from "./InvitationDemoContext";
import { HeroBackground } from "./HeroBackground";
import { ScrollToModules } from "./ScrollToModules";

interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate: string | null;
}

export function InvitationHero({
  firstName,
  partnerName,
  weddingDate,
}: InvitationHeroProps) {
  const { isDemo, heroAsset } = useInvitationDemo();

  return (
    <header className="relative h-[100svh] flex items-center justify-center overflow-hidden">
      <HeroBackground
        frames={isDemo ? heroAsset.frames : 0}
        sequencePath={isDemo ? heroAsset.sequencePath : null}
        loop={isDemo}
      />
      <div className="absolute inset-0 bg-black/30 z-0" />
      <div className="relative z-10 text-center space-y-6 px-4 text-white">
        <h4 className="uppercase tracking-widest text-sm font-bold text-white/80 mb-4">
          Nous nous marions
        </h4>
        <h1 className="font-heading text-6xl md:text-8xl italic drop-shadow-lg">
          {firstName} <span className="text-primary/70">&</span> {partnerName}
        </h1>
        {weddingDate && (
          <p className="text-xl md:text-2xl font-light mt-4 text-white/90 drop-shadow-md">
            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
              new Date(weddingDate)
            )}
          </p>
        )}
      </div>
      <ScrollToModules />
    </header>
  );
}

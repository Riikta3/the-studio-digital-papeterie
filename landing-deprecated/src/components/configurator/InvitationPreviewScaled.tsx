"use client";

import { InvitationDemoContext } from "@/components/invitation/InvitationDemoContext";
import { getModuleComponent } from "@/components/invitation/module-registry";
import { ModulesWrapper } from "@/components/invitation/ModulesWrapper";
import { getAnimationPreview } from "@/components/configurator/AnimationPreviewOverlay";
import { InvitationHero as HeroFloral } from "@/components/invitation/themes/theme-floral/InvitationHero";
import { InvitationHero as HeroMinimalist } from "@/components/invitation/themes/theme-minimalist/InvitationHero";
import { InvitationHero as HeroBoho } from "@/components/invitation/themes/theme-boho/InvitationHero";
import { InvitationHero as HeroRoyal } from "@/components/invitation/themes/theme-royal/InvitationHero";
import { InvitationHero as HeroTravel } from "@/components/invitation/themes/theme-travel/InvitationHero";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HERO_MAP: Record<string, React.ComponentType<any>> = {
  "theme-floral": HeroFloral,
  "theme-minimalist": HeroMinimalist,
  "theme-boho": HeroBoho,
  "theme-royal": HeroRoyal,
  "theme-travel": HeroTravel,
};

const VIRTUAL_WIDTH = 390;

export interface InvitationPreviewScaledProps {
  theme: string;
  animation: string;
  modules: string[];
  partner1: string;
  partner2: string;
  weddingDate: string;
  venue: string;
  isExpanded: boolean;
  containerWidth: number;
}

export function InvitationPreviewScaled({
  theme, animation, modules, partner1, partner2, weddingDate, venue, isExpanded, containerWidth,
}: InvitationPreviewScaledProps) {
  const scale = containerWidth > 0 ? containerWidth / VIRTUAL_WIDTH : 0.35;
  const InvitationHero = HERO_MAP[theme] ?? HeroFloral;
  const isoDate = weddingDate || null;
  const animationPreviewImg = getAnimationPreview(animation);

  return (
    <InvitationDemoContext.Provider value={{ isDemo: true, activeTheme: theme, heroAsset: { frames: 0, sequencePath: null }, animationSequence: null }}>
      <div className={theme} style={{ width: containerWidth, overflow: "hidden", position: "relative" }}>
        <div style={{ width: VIRTUAL_WIDTH, transformOrigin: "top left", transform: `scale(${scale})` }}>
          <div style={{ pointerEvents: "none", userSelect: "none" }}>
            {/* Badge animation — InvitationIntro skippé (fixed/inset-0, incompatible avec preview scalée) */}
            {animationPreviewImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={animationPreviewImg} alt="Animation preview" style={{ width: VIRTUAL_WIDTH, height: "auto", display: "block" }} />
            ) : (
              <div style={{ width: VIRTUAL_WIDTH, height: 140, background: "linear-gradient(135deg,#fdf6f0,#f0d9cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#c97a90", fontStyle: "italic" }}>
                {animation ? animation.replace(/-/g, " ") : "Animation d'ouverture"}
              </div>
            )}
          </div>
          <InvitationHero firstName={partner1 || "Sophie"} partnerName={partner2 || "Pierre"} weddingDate={isoDate} />
          <div style={{ pointerEvents: "none", userSelect: "none" }}>
            <ModulesWrapper>
              {modules.map((moduleId) => {
                const ModuleComponent = getModuleComponent(theme, moduleId);
                if (!ModuleComponent) return null;
                return <ModuleComponent key={moduleId} weddingId="preview" partner1={partner1 || "Sophie"} partner2={partner2 || "Pierre"} weddingDate={isoDate} isDemo />;
              })}
            </ModulesWrapper>
          </div>
        </div>
      </div>
    </InvitationDemoContext.Provider>
  );
}

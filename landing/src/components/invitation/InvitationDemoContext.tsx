"use client";

import { createContext, useContext } from "react";

interface HeroAsset {
  frames: number;
  sequencePath: string | null;
}

interface AnimationSequence {
  desktopPath: string;
  mobilePath: string;
  desktopFrameCount: number;
  mobileFrameCount: number;
}

interface DemoContextValue {
  isDemo: boolean;
  activeTheme: string;
  heroAsset: HeroAsset;
  animationSequence: AnimationSequence | null;
}

const DEFAULT_ANIMATION: AnimationSequence = {
  desktopPath: "/videos/desktop/Animation enveloppe personnalisée_",
  mobilePath: "/videos/mobile/Mobile Test 2_",
  desktopFrameCount: 34,
  mobileFrameCount: 53,
};

export { DEFAULT_ANIMATION };
export type { AnimationSequence };

export const InvitationDemoContext = createContext<DemoContextValue>({
  isDemo: false,
  activeTheme: "floral",
  heroAsset: { frames: 0, sequencePath: null },
  animationSequence: null,
});

export function useInvitationDemo() {
  return useContext(InvitationDemoContext);
}

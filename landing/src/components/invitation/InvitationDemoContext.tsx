"use client";

import { createContext, useContext } from "react";

interface HeroAsset {
  frames: number;
  sequencePath: string | null;
}

interface DemoContextValue {
  isDemo: boolean;
  activeTheme: string;
  heroAsset: HeroAsset;
}

export const InvitationDemoContext = createContext<DemoContextValue>({
  isDemo: false,
  activeTheme: "floral",
  heroAsset: { frames: 0, sequencePath: null },
});

export function useInvitationDemo() {
  return useContext(InvitationDemoContext);
}

"use client";

import { createContext, useContext } from "react";

interface HeroAsset {
  frames: number;
  sequencePath: string | null;
}

interface DemoContextValue {
  isDemo: boolean;
  heroAsset: HeroAsset;
}

export const InvitationDemoContext = createContext<DemoContextValue>({
  isDemo: false,
  heroAsset: { frames: 0, sequencePath: null },
});

export function useInvitationDemo() {
  return useContext(InvitationDemoContext);
}

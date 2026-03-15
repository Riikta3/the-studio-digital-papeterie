"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { InvitationIntro } from "./InvitationIntro";
import { InvitationDemoContext, type AnimationSequence } from "./InvitationDemoContext";

interface InvitationPageClientProps {
  children: React.ReactNode;
  hasIntro?: boolean;
  isDemo?: boolean;
  initialTheme?: string;
}

export function InvitationPageClient({
  children,
  hasIntro = true,
  isDemo = false,
  initialTheme = "floral",
}: InvitationPageClientProps) {
  const [introDone, setIntroDone] = useState(!hasIntro);
  const [activeTheme, setActiveTheme] = useState(initialTheme);
  const [heroAsset, setHeroAsset] = useState<{ frames: number; sequencePath: string | null }>({ frames: 0, sequencePath: null });
  const [animationSequence, setAnimationSequence] = useState<AnimationSequence | null>(null);

  // Lock scroll while intro is active
  useEffect(() => {
    if (!hasIntro || introDone) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [introDone, hasIntro]);

  // Listen for theme changes via postMessage in demo mode
  useEffect(() => {
    if (!isDemo) return;
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "SET_THEME" && typeof e.data.theme === "string") {
        setActiveTheme(e.data.theme);
        if (e.data.heroAsset && typeof e.data.heroAsset.frames === "number") {
          setHeroAsset(e.data.heroAsset);
        }
        if (e.data.animationSequence) {
          setAnimationSequence(e.data.animationSequence);
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isDemo]);

  return (
    <InvitationDemoContext.Provider value={{ isDemo, activeTheme, heroAsset, animationSequence }}>
      <>
        <AnimatePresence>
          {hasIntro && !introDone && (
            <InvitationIntro
              onComplete={() => setIntroDone(true)}
              {...(animationSequence ?? {})}
            />
          )}
        </AnimatePresence>

        {/* Site content fades in from white once intro is done */}
        <motion.div
          initial={hasIntro ? { opacity: 0 } : false}
          animate={{ opacity: introDone ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ pointerEvents: introDone ? "auto" : "none", visibility: introDone ? "visible" : "hidden" }}
          className={`theme-${activeTheme}`}
        >
          {children}
        </motion.div>
      </>
    </InvitationDemoContext.Provider>
  );
}

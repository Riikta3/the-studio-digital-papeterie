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
  const [forceDesktop, setForceDesktop] = useState(false);

  // Lock scroll while intro is active
  useEffect(() => {
    if (!hasIntro || introDone) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [introDone, hasIntro]);

  // Listen for theme changes and scale commands via postMessage in demo mode
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
        if (e.data.device === "desktop") {
          setForceDesktop(true);
        }
      }
        if (e.data?.type === "SET_MOBILE_SCALE" && typeof e.data.scale === "number") {
          const scale = e.data.scale;
          document.documentElement.style.width = "390px";
          document.documentElement.style.transformOrigin = "top left";
          document.documentElement.style.transform = `scale(${scale})`;
          document.documentElement.style.overflowX = "hidden";
          document.documentElement.style.scrollbarWidth = "none";
          // Fix height bounds after scale
          document.documentElement.style.height = `${100 / scale}%`;
          
          document.body.style.width = "390px";
          document.body.style.minHeight = "unset";
          document.body.style.overflowX = "hidden";
          document.body.style.scrollbarWidth = "none";
          const realH = window.visualViewport?.height ?? window.innerHeight;
          const cssH = realH / scale;
          document.documentElement.style.setProperty("--real-vh", `${cssH}px`);
        }
        if (e.data?.type === "SET_DESKTOP_SCALE" && typeof e.data.scale === "number") {
          const scale = e.data.scale;
          document.documentElement.style.width = "1024px";
          document.documentElement.style.transformOrigin = "top left";
          document.documentElement.style.transform = `scale(${scale})`;
          document.documentElement.style.overflowX = "hidden";
          document.documentElement.style.scrollbarWidth = "none";
          // Fix height bounds after scale
          document.documentElement.style.height = `${100 / scale}%`;

          document.body.style.width = "1024px";
          document.body.style.minHeight = "unset";
          document.body.style.overflowX = "hidden";
          document.body.style.scrollbarWidth = "none";
          // Set --vh to real iframe height (unaffected by scale) so hero fills screen
          const realH = window.visualViewport?.height ?? window.innerHeight;
          const cssH = realH / scale;
          document.documentElement.style.setProperty("--real-vh", `${cssH}px`);
          setForceDesktop(true);
        }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isDemo]);

  return (
    <InvitationDemoContext.Provider value={{ isDemo, activeTheme, heroAsset, animationSequence }}>
      <>
        <AnimatePresence>
          {hasIntro && !introDone && (!isDemo || animationSequence !== null) && (
            <InvitationIntro
              onComplete={() => setIntroDone(true)}
              autoplay={isDemo}
              forceDesktop={forceDesktop}
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

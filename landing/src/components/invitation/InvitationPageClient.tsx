"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { InvitationIntro } from "./InvitationIntro";
import { InvitationDemoContext, type AnimationSequence } from "./InvitationDemoContext";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Shared data for demo controls
const THEMES: { key: string; dotColors: [string, string] }[] = [
  { key: "floral", dotColors: ["#fef1ee", "#fbdcd5"] },
  { key: "minimal", dotColors: ["#ffffff", "#e5e5e5"] },
  { key: "classic", dotColors: ["#fffaed", "#f3e1b1"] },
  { key: "modern", dotColors: ["#0a0a0a", "#262626"] },
  { key: "romantic", dotColors: ["#fff0f5", "#ffb6c1"] },
];

const THEME_LABELS: Record<string, string> = {
  floral: "Floral",
  minimal: "Minimaliste",
  classic: "Classique",
  modern: "Moderne",
  romantic: "Romantique",
};

const ANIMATIONS: { key: string; icon: string }[] = [
  { key: "envelope", icon: "✉️" },
  { key: "doors", icon: "🚪" },
  { key: "curtains", icon: "🎭" },
];

const ANIMATION_SEQUENCES: Record<string, AnimationSequence> = {
  envelope: {
    desktopPath: "/videos/desktop/Animation enveloppe personnalisée_",
    mobilePath:  "/videos/demo/envelop/Mobile Test 2_",
    desktopFrameCount: 34,
    mobileFrameCount:  53,
  },
  doors: {
    desktopPath: "/videos/demo/door/Vidéo porte s'ouvrant naturellement_",
    mobilePath:  "/videos/demo/door/Vidéo porte s'ouvrant naturellement_",
    desktopFrameCount: 82,
    mobileFrameCount:  82,
  },
  curtains: {
    desktopPath: "/videos/demo/curtain/Vidéo prête portrait_",
    mobilePath:  "/videos/demo/curtain/Vidéo prête portrait_",
    desktopFrameCount: 82,
    mobileFrameCount:  82,
  },
};

interface InvitationPageClientProps {
  children: React.ReactNode;
  hasIntro?: boolean;
  isDemo?: boolean;
  initialTheme?: string;
  weddingSlug?: string;
}

function FloatingDemoControls({
  activeAnimation,
  setActiveAnimation,
  activeTheme,
  setActiveTheme,
  activeDevice,
  onToggleDevice,
  isDesktop
}: {
  activeAnimation: string;
  setActiveAnimation: (a: string) => void;
  activeTheme: string;
  setActiveTheme: (t: string) => void;
  activeDevice: "mobile" | "desktop";
  onToggleDevice: () => void;
  isDesktop?: boolean;
}) {
  const t = useTranslations("ProductDemo");
  const [expanded, setExpanded] = useState<"none" | "animation" | "theme" | "device">("none");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setExpanded("none");
      }
    };
    if (expanded !== "none") {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded]);

  return (
    <div
      className="left-1/2 -translate-x-1/2 z-[9999]"
      style={{
        position: "fixed",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)"
      }}
      ref={panelRef}
    >
      <div className="flex items-center gap-1.5 p-1.5 bg-background/85 backdrop-blur-xl border border-border shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] transition-all">
        {/* Device Selector */}
        <div>
          <button
            onClick={() => setExpanded(expanded === "device" ? "none" : "device")}
            className={cn(
              "flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all",
              expanded === "device" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 text-foreground"
            )}
            title="Appareil"
          >
            {activeDevice === "mobile" ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
            )}
          </button>
          
          {expanded === "device" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-card border border-border shadow-xl rounded-2xl p-2 w-40 flex flex-col gap-1">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Appareil</div>
              <button
                onClick={() => { if (activeDevice !== "mobile") onToggleDevice(); setExpanded("none"); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all",
                  activeDevice === "mobile" ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                <span>Mobile</span>
              </button>
              <button
                onClick={() => { if (activeDevice !== "desktop") onToggleDevice(); setExpanded("none"); }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all",
                  activeDevice === "desktop" ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                )}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                <span>Bureau</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Animation Selector */}
        <div>
          <button
            onClick={() => setExpanded(expanded === "animation" ? "none" : "animation")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              expanded === "animation" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 text-foreground"
            )}
          >
            <span className="text-base">{ANIMATIONS.find((a) => a.key === activeAnimation)?.icon || "✉️"}</span>
            <span className="hidden sm:inline">{t("animationLabel")}</span>
          </button>

          {expanded === "animation" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-card border border-border shadow-xl rounded-2xl p-2 w-48 flex flex-col gap-1">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Choisir une animation</div>
              {ANIMATIONS.map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => { setActiveAnimation(key); setExpanded("none"); }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all",
                    key === activeAnimation ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className="text-xl">{icon}</span>
                  <span>
                    {key === "envelope" && t("animationEnvelope")}
                    {key === "doors" && t("animationDoors")}
                    {key === "curtains" && t("animationCurtains")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Theme Selector */}
        <div>
          <button
            onClick={() => setExpanded(expanded === "theme" ? "none" : "theme")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
              expanded === "theme" ? "bg-primary text-primary-foreground" : "hover:bg-primary/10 text-foreground"
            )}
          >
            <span
              className="w-3.5 h-3.5 rounded-full shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${THEMES.find((t) => t.key === activeTheme)?.dotColors[0] || "#fff"}, ${THEMES.find((t) => t.key === activeTheme)?.dotColors[1] || "#ccc"})`,
              }}
            />
            <span className="hidden sm:inline">{THEME_LABELS[activeTheme] || activeTheme}</span>
          </button>

          {expanded === "theme" && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-card border border-border shadow-xl rounded-2xl p-3 w-max grid grid-cols-5 gap-2">
              <div className="col-span-5 px-1 py-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Choisir un thème</div>
              {THEMES.map(({ key, dotColors }) => (
                <button
                  key={key}
                  onClick={() => { setActiveTheme(key); setExpanded("none"); }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    key === activeTheme ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "hover:scale-110"
                  )}
                  title={THEME_LABELS[key]}
                >
                  <span
                    className="w-8 h-8 rounded-full shadow-inner"
                    style={{ background: `linear-gradient(135deg, ${dotColors[0]}, ${dotColors[1]})` }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InvitationPageClient({
  children,
  hasIntro = true,
  isDemo = false,
  initialTheme = "floral",
  weddingSlug = "",
}: InvitationPageClientProps) {
  const [introDone, setIntroDone] = useState(!hasIntro);
  const [activeTheme, setActiveTheme] = useState(initialTheme);
  const [heroAsset, setHeroAsset] = useState<{ frames: number; sequencePath: string | null }>({ frames: 0, sequencePath: null });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Initialize animation sequence safely for SSR
  const [animationSequence, setAnimationSequence] = useState<AnimationSequence | null>(() => {
    if (!isDemo || !weddingSlug) return null;
    let key = "envelope";
    if (weddingSlug.includes("door") || weddingSlug === "emma-lucas") key = "doors";
    if (weddingSlug.includes("curtain") || weddingSlug === "sarah-david") key = "curtains";
    return ANIMATION_SEQUENCES[key] || null;
  });

  // Active animation key derived from sequence path or fallback to envelope
  const currentAnimationKey = (() => {
    if (!animationSequence) return "envelope";
    const path = animationSequence.desktopPath || animationSequence.mobilePath || "";
    if (path.includes("portes")) return "doors";
    if (path.includes("rideaux")) return "curtains";
    return "envelope";
  })();

  // Notify parent to reload iframe when animation changes
  const handleAnimationChange = useCallback((newAnim: string) => {
    // Determine the path mapping based on standard animations (hardcoded dictionary matches landing's DEMO_CODES)
    const DEMO_CODES: Record<string, string> = {
      envelope: "olivia-thomas",
      doors: "emma-lucas",
      curtains: "sarah-david",
    };
    
    const newPath = `/fr/invitation/${DEMO_CODES[newAnim]}?demo=true`;
    // Communicate via history or reload. Since iframe URL is driven by parent, it's safer to postMessage up so the parent alters the URL.
    window.parent.postMessage({ type: "SYNC_ANIMATION", animation: newAnim }, "*");
  }, []);

  // Sync theme changes locally and emit up just in case parent tracks it
  const handleThemeChange = useCallback((newTheme: string) => {
    setActiveTheme(newTheme);
    window.parent.postMessage({ type: "SYNC_THEME", theme: newTheme }, "*");
  }, []);

  const handleDeviceToggle = useCallback(() => {
    const newDevice = isDesktop ? "mobile" : "desktop";
    window.parent.postMessage({ type: "SYNC_DEVICE", device: newDevice }, "*");
  }, [isDesktop]);

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
          setIsDesktop(true);
        } else if (e.data.device === "mobile") {
          setIsDesktop(false);
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
          {hasIntro && !introDone && (!isDemo || animationSequence !== null) && (
            <InvitationIntro
              onComplete={() => setIntroDone(true)}
              autoplay={isDemo}
              forceDesktop={isDesktop}
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

        {/* Demo Floating Controls exclusively shown within the iframe when scrolling or active, even during intro */}
        {isDemo && (
          <FloatingDemoControls
            activeAnimation={currentAnimationKey}
            setActiveAnimation={handleAnimationChange}
            activeTheme={activeTheme}
            setActiveTheme={handleThemeChange}
            activeDevice={isDesktop ? "desktop" : "mobile"}
            onToggleDevice={handleDeviceToggle}
            isDesktop={isDesktop}
          />
        )}
      </>
    </InvitationDemoContext.Provider>
  );
}

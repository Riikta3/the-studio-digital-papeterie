"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  DoorOpen,
  GalleryHorizontalEnd,
  Mail,
  MonitorSmartphone,
  Palette,
  Pen,
  Wand2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  InvitationDemoContext,
  type AnimationSequence,
} from "./InvitationDemoContext";
import { InvitationIntro } from "./InvitationIntro";

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

const ANIMATIONS: { key: string; icon: React.ReactNode }[] = [
  { key: "envelope", icon: <Mail className='w-4 h-4' /> },
  { key: "doors", icon: <DoorOpen className='w-4 h-4' /> },
  { key: "curtains", icon: <GalleryHorizontalEnd className='w-4 h-4' /> },
];

const ANIMATION_SEQUENCES: Record<string, AnimationSequence> = {
  envelope: {
    desktopPath: "/videos/desktop/Animation enveloppe personnalisée_",
    mobilePath: "/videos/demo/envelop/Mobile Test 2_",
    desktopFrameCount: 34,
    mobileFrameCount: 53,
  },
  doors: {
    desktopPath: "/videos/demo/door/Vidéo porte s'ouvrant naturellement_",
    mobilePath: "/videos/demo/door/Vidéo porte s'ouvrant naturellement_",
    desktopFrameCount: 82,
    mobileFrameCount: 82,
  },
  curtains: {
    desktopPath: "/videos/demo/curtain/Vidéo prête portrait_",
    mobilePath: "/videos/demo/curtain/Vidéo prête portrait_",
    desktopFrameCount: 82,
    mobileFrameCount: 82,
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
  isDesktop,
  defaultTheme,
  defaultAnimation,
}: {
  activeAnimation: string;
  setActiveAnimation: (a: string) => void;
  activeTheme: string;
  setActiveTheme: (t: string) => void;
  activeDevice: "mobile" | "desktop";
  onToggleDevice: () => void;
  isDesktop?: boolean;
  defaultTheme: string;
  defaultAnimation: string;
}) {
  const t = useTranslations("ProductDemo");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activeTab, setActiveTab] = useState<"animation" | "theme" | "device">(
    "theme",
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const [isNativeMobile, setIsNativeMobile] = useState(false);

  useEffect(() => {
    // Detect if user is on a real mobile device natively
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const isMobileAgent =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          );
        setIsNativeMobile(isMobileAgent || window.innerWidth <= 450);
      }
    };
    checkMobile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  return (
    <div
      className='fixed bottom-6 left-6 flex flex-col items-start pointer-events-none z-[9999] gap-3'
      ref={panelRef}
    >
      <div className='relative pointer-events-auto w-12 h-12 flex items-center justify-center group drop-shadow-2xl'>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(4px)" }}
              transition={{
                duration: 0.3,
                type: "spring",
                damping: 25,
                stiffness: 300,
              }}
              className='absolute bottom-full mb-4 left-0 w-[240px] bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_32px_80px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.5)] rounded-3xl overflow-hidden origin-bottom-left'
            >
              <div className='flex items-center p-2 bg-black/5 mx-2 mt-2 rounded-2xl'>
                <button
                  onClick={() => setActiveTab("device")}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-semibold transition-all",
                    activeTab === "device"
                      ? "bg-white/40 backdrop-blur-md text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] border border-white/40"
                      : "hover:text-foreground text-muted-foreground",
                  )}
                >
                  <MonitorSmartphone className='w-3.5 h-3.5 mb-0.5' />
                  Appareil
                </button>
                <button
                  onClick={() => setActiveTab("animation")}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-semibold transition-all",
                    activeTab === "animation"
                      ? "bg-white/40 backdrop-blur-md text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] border border-white/40"
                      : "hover:text-foreground text-muted-foreground",
                  )}
                >
                  <Wand2 className='w-3.5 h-3.5 mb-0.5' />
                  Animation
                </button>
                <button
                  onClick={() => setActiveTab("theme")}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-[10px] font-semibold transition-all",
                    activeTab === "theme"
                      ? "bg-white/40 backdrop-blur-md text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)] border border-white/40"
                      : "hover:text-foreground text-muted-foreground",
                  )}
                >
                  <Palette className='w-3.5 h-3.5 mb-0.5' />
                  Thème
                </button>
              </div>

              <div className='p-4 pt-4'>
                <AnimatePresence mode='popLayout'>
                  {activeTab === "device" && (
                    <motion.div
                      key='device'
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className='grid grid-cols-2 gap-2'
                    >
                      <button
                        onClick={() =>
                          activeDevice !== "mobile" && onToggleDevice()
                        }
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all",
                          activeDevice === "mobile"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border/50 hover:border-border hover:bg-black/5 text-muted-foreground",
                        )}
                      >
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <rect
                            width='14'
                            height='20'
                            x='5'
                            y='2'
                            rx='2'
                            ry='2'
                          />
                          <path d='M12 18h.01' />
                        </svg>
                        <span className='text-xs font-medium'>Mobile</span>
                      </button>
                      <button
                        onClick={() =>
                          activeDevice !== "desktop" && onToggleDevice()
                        }
                        className={cn(
                          "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all",
                          activeDevice === "desktop"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border/50 hover:border-border hover:bg-black/5 text-muted-foreground",
                        )}
                      >
                        <svg
                          width='20'
                          height='20'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <rect
                            width='20'
                            height='14'
                            x='2'
                            y='3'
                            rx='2'
                          />
                          <line
                            x1='8'
                            x2='16'
                            y1='21'
                            y2='21'
                          />
                          <line
                            x1='12'
                            x2='12'
                            y1='17'
                            y2='21'
                          />
                        </svg>
                        <span className='text-xs font-medium'>Bureau</span>
                      </button>
                    </motion.div>
                  )}
                  {activeTab === "animation" && (
                    <motion.div
                      key='animation'
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className='flex flex-col gap-2'
                    >
                      {ANIMATIONS.map(({ key, icon }) => (
                        <button
                          key={key}
                          onClick={() => setActiveAnimation(key)}
                          className={cn(
                            "flex items-center gap-2.5 w-full p-2.5 rounded-2xl border transition-all",
                            key === activeAnimation
                              ? "border-primary bg-primary/5 text-primary backdrop-blur-sm shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                              : "border-transparent hover:bg-black/5 text-foreground",
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full",
                              key === activeAnimation
                                ? "bg-primary/20"
                                : "bg-black/5",
                            )}
                          >
                            {icon}
                          </div>
                          <span className='text-sm font-medium'>
                            {t(
                              key === "envelope"
                                ? "animationEnvelope"
                                : key === "doors"
                                  ? "animationDoors"
                                  : "animationCurtains",
                            )}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                  {activeTab === "theme" && (
                    <motion.div
                      key='theme'
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className='grid grid-cols-3 gap-x-2 gap-y-4'
                    >
                      {THEMES.map(({ key, dotColors }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTheme(key)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 transition-all p-1 rounded-xl",
                            key === activeTheme
                              ? "bg-primary/5"
                              : "hover:scale-105",
                          )}
                          title={THEME_LABELS[key]}
                        >
                          <span
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-inner shrink-0",
                              key === activeTheme
                                ? "ring-2 ring-primary ring-offset-2 border-transparent"
                                : "border-black/10",
                            )}
                            style={{
                              background: `linear-gradient(135deg, ${dotColors[0]}, ${dotColors[1]})`,
                            }}
                          />
                          <span
                            className={cn(
                              "text-[10px] sm:text-[11px] font-medium text-center leading-[1.2] px-0.5",
                              key === activeTheme
                                ? "text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {THEME_LABELS[key]}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout
          onClick={() => {
            setIsExpanded(!isExpanded);
            setHasInteracted(true);
            if (!isExpanded) setActiveTab("theme");
          }}
          animate={{
            borderRadius: 24,
          }}
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-xl border border-white/60 text-zinc-800 transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.8)]",
            !isExpanded &&
              "hover:bg-white hover:shadow-[0_16px_48px_rgba(0,0,0,0.25)] hover:-translate-y-1 hover:text-primary",
            isExpanded &&
              "text-primary bg-white/80 backdrop-blur-md ring-1 ring-primary/30",
          )}
          aria-label={isExpanded ? "Fermer" : "Personnaliser"}
        >
          <motion.div
            layout='position'
            initial={false}
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{
              duration: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            {isExpanded ? (
              <X className='w-5 h-5' />
            ) : (
              <Pen className='w-5 h-5' />
            )}
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {!isExpanded && !hasInteracted && (
            <motion.div
              initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -8, filter: "blur(4px)" }}
              onClick={() => {
                setIsExpanded(true);
                setHasInteracted(true);
                setActiveTab("theme");
              }}
              className='absolute left-full ml-4 top-1 -translate-y-1/2 px-4 py-2 bg-primary text-primary-foreground text-[14px] font-bold tracking-tight rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer pointer-events-auto shadow-[0_12px_32px_rgba(var(--primary-rgb),0.3)] border border-primary/20 z-50 flex items-center'
            >
              Personnalisez l'expérience
              <div className='absolute top-1/2 -left-1.5 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-primary' />
            </motion.div>
          )}
        </AnimatePresence>
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
  const [heroAsset, setHeroAsset] = useState<{
    frames: number;
    sequencePath: string | null;
  }>({ frames: 0, sequencePath: null });
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsDesktop(window.innerWidth >= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Initialize animation sequence safely for SSR
  const [animationSequence, setAnimationSequence] =
    useState<AnimationSequence | null>(() => {
      if (!isDemo || !weddingSlug) return null;
      let key = "envelope";
      if (weddingSlug.includes("door") || weddingSlug === "emma-lucas")
        key = "doors";
      if (weddingSlug.includes("curtain") || weddingSlug === "sarah-david")
        key = "curtains";
      return ANIMATION_SEQUENCES[key] || null;
    });

  // Active animation key derived from sequence path or fallback to envelope
  const currentAnimationKey = (() => {
    if (!animationSequence) return "envelope";
    const path = (
      animationSequence.desktopPath ||
      animationSequence.mobilePath ||
      ""
    ).toLowerCase();
    if (path.includes("porte")) return "doors";
    if (path.includes("curtain") || path.includes("portrait"))
      return "curtains";
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
    window.parent.postMessage(
      { type: "SYNC_ANIMATION", animation: newAnim },
      "*",
    );
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
      if (e.data?.type === "PLAY_INTRO") {
        setShouldPlay(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isDemo]);

  return (
    <InvitationDemoContext.Provider
      value={{ isDemo, activeTheme, heroAsset, animationSequence }}
    >
      <>
        <AnimatePresence>
          {hasIntro &&
            !introDone &&
            (!isDemo || animationSequence !== null) && (
              <InvitationIntro
                onComplete={() => setIntroDone(true)}
                autoplay={isDemo && shouldPlay}
                forceDesktop={isDesktop ?? undefined}
                {...(animationSequence ?? {})}
              />
            )}
        </AnimatePresence>

        {/* Site content fades in from white once intro is done */}
        <motion.div
          initial={hasIntro ? { opacity: 0 } : false}
          animate={{ opacity: introDone ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            pointerEvents: introDone ? "auto" : "none",
            visibility: introDone ? "visible" : "hidden",
          }}
          className={`theme-${activeTheme}`}
        >
          {children}
        </motion.div>

        {/* Demo Floating Controls exclusively shown within the iframe when scrolling or active, even during intro */}
        {isDemo && isDesktop !== null && (
          <FloatingDemoControls
            activeAnimation={currentAnimationKey}
            setActiveAnimation={handleAnimationChange}
            activeTheme={activeTheme}
            setActiveTheme={handleThemeChange}
            activeDevice={isDesktop ? "desktop" : "mobile"}
            onToggleDevice={handleDeviceToggle}
            isDesktop={isDesktop ?? undefined}
            defaultTheme={initialTheme}
            defaultAnimation={(() => {
              if (weddingSlug.includes("door") || weddingSlug === "emma-lucas")
                return "doors";
              if (
                weddingSlug.includes("curtain") ||
                weddingSlug === "sarah-david"
              )
                return "curtains";
              return "envelope";
            })()}
          />
        )}
      </>
    </InvitationDemoContext.Provider>
  );
}

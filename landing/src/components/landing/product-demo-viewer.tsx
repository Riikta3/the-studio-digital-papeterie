"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect, useCallback } from "react";
import { Monitor, Smartphone, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AnimationKey = "envelope" | "doors" | "curtains";
type ThemeKey = "floral" | "royal" | "boho" | "minimalist" | "modern";

const DEMO_CODES: Record<AnimationKey, string> = {
  envelope: "demo-envelope",
  doors:    "demo-doors",
  curtains: "demo-curtains",
};

type AnimationSequence = {
  desktopPath: string;
  mobilePath: string;
  desktopFrameCount: number;
  mobileFrameCount: number;
};

const ANIMATION_SEQUENCES: Record<AnimationKey, AnimationSequence> = {
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

type HeroAsset = {
  frames: number;
  sequencePath: string | null;
};

const DEMO_HERO: HeroAsset = { frames: 82, sequencePath: "/videos/demo/themes/test/Bohemian Bird Video_" };

const THEME_HERO_ASSETS: Record<ThemeKey, HeroAsset> = {
  boho:       DEMO_HERO,
  floral:     DEMO_HERO,
  royal:      DEMO_HERO,
  minimalist: DEMO_HERO,
  modern:     DEMO_HERO,
};

const ANIMATIONS: { key: AnimationKey; icon: string }[] = [
  { key: "envelope", icon: "✉️" },
  { key: "doors",    icon: "🚪" },
  { key: "curtains", icon: "🎭" },
];

const THEMES: { key: ThemeKey; dotColors: [string, string] }[] = [
  { key: "floral",     dotColors: ["#c97a90", "#8b2040"] },
  { key: "royal",      dotColors: ["#c9a96e", "#2d3a6b"] },
  { key: "boho",       dotColors: ["#c4a882", "#8b5e3c"] },
  { key: "minimalist", dotColors: ["#999999", "#222222"] },
  { key: "modern",     dotColors: ["#b07acc", "#4a1570"] },
];

const THEME_LABELS: Record<ThemeKey, string> = {
  floral: "Floral",
  royal: "Royal",
  boho: "Bohème",
  minimalist: "Minimaliste",
  modern: "Modern",
};

function MobileFrame({
  iframeUrl,
  iframeRef,
  theme,
  loading,
  onLoad,
}: {
  iframeUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  theme: string;
  loading: boolean;
  onLoad: () => void;
}) {
  return (
    <div className="flex justify-center">
      <div
        className="relative"
        style={{
          background: "#1c1c1e",
          borderRadius: 44,
          padding: "14px 12px 20px",
          width: 300,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.35), 0 32px 80px rgba(0,0,0,0.28)",
        }}
      >
        <div className="absolute left-[-3px] top-[90px] w-[3px] h-8 rounded-l bg-[#2a2a2c] shadow-[0_38px_0_#2a2a2c,0_76px_0_#2a2a2c]" />
        <div className="absolute right-[-3px] top-[120px] w-[3px] h-[60px] rounded-r bg-[#2a2a2c]" />
        <div className="w-[88px] h-7 bg-[#1c1c1e] rounded-b-[20px] mx-auto relative z-10 flex items-center justify-center gap-1.5 mb-[-6px]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2a2a2c] border border-[#333]" />
          <div className="w-9 h-1 bg-[#2a2a2c] rounded" />
        </div>
        {/* Inner screen: clip to 276×560, iframe renders at 390px then scaled down */}
        <div className="rounded-[32px] overflow-hidden bg-background relative" style={{ width: 276, height: 560 }}>
          {loading && (
            <div className="absolute inset-0 bg-background z-10 flex items-center justify-center">
              <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            width={390}
            height={790}
            className="border-none absolute top-0 left-0"
            style={{
              transformOrigin: "top left",
              transform: `scale(${276 / 390})`,
            }}
            title={`Démo ${theme}`}
            onLoad={onLoad}
          />
        </div>
      </div>
    </div>
  );
}

function DesktopFrame({
  iframeUrl,
  iframeRef,
  theme,
  loading,
  onLoad,
}: {
  iframeUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  theme: string;
  loading: boolean;
  onLoad: () => void;
}) {
  const urlPath = iframeUrl.split("/invitation/")[1]?.split("?")[0] || "";
  const displayUrl = `thestudio.wedding/invitation/${urlPath}`;

  return (
    <div>
      <div
        style={{
          background: "#1c1c1e",
          borderRadius: 12,
          padding: 8,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.4), 0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div className="h-[22px] bg-[#2a2a2c] rounded-t-[6px] flex items-center px-2.5 gap-1.5 mb-px">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <div className="flex-1 mx-3 bg-[#3a3a3c] rounded h-3.5 flex items-center px-2">
            <span className="text-[8px] text-white/35 font-mono truncate">{displayUrl}</span>
          </div>
        </div>
        {/* Inner screen: clip to 304×480, iframe renders at 1024px then scaled down */}
        <div className="rounded-b-[6px] overflow-hidden bg-background relative border border-[#3a3a3c]" style={{ width: 304, height: 480 }}>
          {loading && (
            <div className="absolute inset-0 bg-background z-10 flex items-center justify-center">
              <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            width={1024}
            height={Math.round(480 / (304 / 1024))}
            className="border-none absolute top-0 left-0"
            style={{
              transformOrigin: "top left",
              transform: `scale(${304 / 1024})`,
            }}
            title={`Démo ${theme}`}
            onLoad={onLoad}
          />
        </div>
      </div>
      <div className="mx-auto" style={{ width: 120, height: 18, background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)", clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)" }} />
      <div className="mx-auto" style={{ width: 320, height: 8, background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)", borderRadius: "0 0 4px 4px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

export function ProductDemoViewer() {
  const t = useTranslations("ProductDemo");
  const [activeAnimation, setActiveAnimation] = useState<AnimationKey>("envelope");
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("floral");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [iframeLoading, setIframeLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);

  const iframeUrl = `/fr/invitation/${DEMO_CODES[activeAnimation]}?demo=true`;

  const sendTheme = useCallback((theme: ThemeKey, animation: AnimationKey, ref?: React.RefObject<HTMLIFrameElement | null>) => {
    const iframe = (ref ?? iframeRef).current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: "SET_THEME",
        theme,
        heroAsset: THEME_HERO_ASSETS[theme],
        animationSequence: ANIMATION_SEQUENCES[animation],
      },
      window.location.origin
    );
  }, []);

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  // Reset loading when animation or device changes (iframe remounts)
  useEffect(() => {
    setIframeLoading(true);
  }, [activeAnimation, device]);

  // Send theme on theme-only changes (iframe stays alive, no reload)
  const prevAnimationRef = useRef(activeAnimation);
  useEffect(() => {
    if (prevAnimationRef.current !== activeAnimation) {
      prevAnimationRef.current = activeAnimation;
      return; // animation change → iframe reloads → handleIframeLoad will send theme
    }
    const timeout = setTimeout(() => sendTheme(activeTheme, activeAnimation), 300);
    return () => clearTimeout(timeout);
  }, [activeTheme, activeAnimation, sendTheme]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    setTimeout(() => sendTheme(activeTheme, activeAnimation), 100);
  }, [sendTheme, activeTheme, activeAnimation]);

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
          {t("demosEyebrow")}
        </p>
        <h2 className="font-heading text-4xl md:text-5xl font-medium text-foreground leading-tight">
          {t("demosTitleLine1")}{" "}
          <span className="italic text-primary">{t("demosTitleLine2")}</span>
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">{t("demosSub")}</p>
      </div>

      {/* Step 1 — Animation */}
      <div className="mb-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
          {t("animationLabel")}
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {ANIMATIONS.map(({ key, icon }) => (
            <button
              key={key}
              onClick={() => setActiveAnimation(key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all",
                key === activeAnimation
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              )}
            >
              <span>{icon}</span>
              {key === "envelope" && t("animationEnvelope")}
              {key === "doors" && t("animationDoors")}
              {key === "curtains" && t("animationCurtains")}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Theme */}
      <div className="mb-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-3">
          ② Thème
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {THEMES.map(({ key, dotColors }) => (
            <button
              key={key}
              onClick={() => setActiveTheme(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all",
                key === activeTheme
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${dotColors[0]}, ${dotColors[1]})` }}
              />
              {THEME_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Device frame — key forces remount on device switch so iframe gets correct viewport */}
      {device === "mobile" ? (
        <MobileFrame
          key="mobile"
          iframeUrl={iframeUrl}
          iframeRef={iframeRef}
          theme={THEME_LABELS[activeTheme]}
          loading={iframeLoading}
          onLoad={handleIframeLoad}
        />
      ) : (
        <DesktopFrame
          key="desktop"
          iframeUrl={iframeUrl}
          iframeRef={iframeRef}
          theme={THEME_LABELS[activeTheme]}
          loading={iframeLoading}
          onLoad={handleIframeLoad}
        />
      )}

      {/* Device toggle + fullscreen — below the frame */}
      <div className="flex flex-col items-center gap-3 mt-10">
        <div className="inline-flex bg-card border border-border rounded-full p-1 gap-0.5 shadow-sm">
          <button
            onClick={() => setDevice("mobile")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              device === "mobile"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            {t("deviceMobile")}
          </button>
          <button
            onClick={() => setDevice("desktop")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all",
              device === "desktop"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            {t("deviceDesktop")}
          </button>
        </div>

        <button
          onClick={() => setFullscreen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium bg-card hover:bg-primary/5 transition-colors shadow-sm"
        >
          <Expand className="w-3.5 h-3.5" />
          {t("openFullscreen")}
        </button>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-full h-full">
            <iframe
              ref={fullscreenIframeRef}
              src={iframeUrl}
              className="w-full h-full border-none block"
              title={`Démo ${THEME_LABELS[activeTheme]} plein écran`}
              onLoad={() => setTimeout(() => sendTheme(activeTheme, activeAnimation, fullscreenIframeRef), 100)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

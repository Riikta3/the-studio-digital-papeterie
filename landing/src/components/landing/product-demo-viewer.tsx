"use client";

import { Expand, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

export type AnimationKey = "envelope" | "doors" | "curtains";
export type ThemeKey = "floral" | "royal" | "boho" | "minimalist" | "modern";

export const DEMO_CODES: Record<AnimationKey, string> = {
  envelope: "demo-envelope",
  doors: "demo-doors",
  curtains: "demo-curtains",
};

export type AnimationSequence = {
  desktopPath: string;
  mobilePath: string;
  desktopFrameCount: number;
  mobileFrameCount: number;
};

export const ANIMATION_SEQUENCES: Record<AnimationKey, AnimationSequence> = {
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

export type HeroAsset = {
  frames: number;
  sequencePath: string | null;
};

const DEMO_HERO: HeroAsset = {
  frames: 82,
  sequencePath: "/videos/demo/themes/test/Bohemian Bird Video_",
};

export const THEME_HERO_ASSETS: Record<ThemeKey, HeroAsset> = {
  boho: DEMO_HERO,
  floral: DEMO_HERO,
  royal: DEMO_HERO,
  minimalist: DEMO_HERO,
  modern: DEMO_HERO,
};

const ANIMATIONS: { key: AnimationKey; icon: string }[] = [
  { key: "envelope", icon: "✉️" },
  { key: "doors", icon: "🚪" },
  { key: "curtains", icon: "🎭" },
];

const THEMES: { key: ThemeKey; dotColors: [string, string] }[] = [
  { key: "floral", dotColors: ["#c97a90", "#8b2040"] },
  { key: "royal", dotColors: ["#c9a96e", "#2d3a6b"] },
  { key: "boho", dotColors: ["#c4a882", "#8b5e3c"] },
  { key: "minimalist", dotColors: ["#999999", "#222222"] },
  { key: "modern", dotColors: ["#b07acc", "#4a1570"] },
];

const THEME_LABELS: Record<ThemeKey, string> = {
  floral: "Floral",
  royal: "Royal",
  boho: "Bohème",
  minimalist: "Minimaliste",
  modern: "Modern",
};

const MOBILE_VIEWPORT = 390;

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
  const screenRef = useRef<HTMLDivElement>(null);

  // Forward mouse wheel events to iframe scroll
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      iframeRef.current?.contentWindow?.scrollBy({
        top: e.deltaY,
        behavior: "auto",
      });
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [iframeRef]);

  return (
    <div className='flex justify-center w-full px-4 md:px-0 py-10'>
      <div
        style={{ width: 422 * 0.85, height: 800 * 0.85 }}
        className='relative mx-auto'
      >
        <div
          className='absolute top-0 left-0'
          style={{
            background: "#1c1c1e",
            borderRadius: 56,
            padding: "16px",
            width: 422,
            height: 800,
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.35), 0 32px 80px rgba(0,0,0,0.28)",
            transform: "scale(0.85)",
            transformOrigin: "top left",
          }}
        >
          {/* Hardware buttons */}
          <div className='absolute left-[-3px] top-[140px] w-[3px] h-8 rounded-l bg-[#2a2a2c] shadow-[0_50px_0_#2a2a2c,0_100px_0_#2a2a2c]' />
          <div className='absolute right-[-3px] top-[180px] w-[3px] h-[70px] rounded-r bg-[#2a2a2c]' />

          {/* Dynamic Island style notch inside the screen area */}
          <div
            ref={screenRef}
            className='rounded-[40px] overflow-hidden bg-background relative'
            style={{ width: 390, height: 768 }}
          >
            {/* Dynamic Island Component */}
            <div className='absolute top-3 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full z-20 flex items-center justify-between px-3 shadow-sm'>
              {/* Camera lens */}
              <div className='w-3.5 h-3.5 rounded-full bg-[#111] border border-[#222] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]' />
              {/* Sensor */}
              <div className='w-2 h-2 rounded-full bg-[#0a0a0a]' />
            </div>

            {loading && (
              <div className='absolute inset-0 bg-background z-10 flex items-center justify-center'>
                <div className='w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin' />
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              className='border-none block w-full h-full'
              title={`Démo ${theme}`}
              onLoad={onLoad}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const DESKTOP_VIEWPORT = 1024;
const DESKTOP_SCREEN_H = 420;

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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [screenW, setScreenW] = useState(0);
  const urlPath = iframeUrl.split("/invitation/")[1]?.split("?")[0] || "";
  const displayUrl = `thestudio.wedding/invitation/${urlPath}`;

  // Forward mouse wheel events to iframe scroll
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      iframeRef.current?.contentWindow?.scrollBy({
        top: e.deltaY,
        behavior: "auto",
      });
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [iframeRef]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setScreenW(el.offsetWidth);
    });
    ro.observe(el);
    setScreenW(el.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const scale = screenW > 0 ? screenW / DESKTOP_VIEWPORT : 1;

  return (
    <div ref={wrapperRef}>
      <div
        style={{
          background: "#1c1c1e",
          borderRadius: 12,
          padding: 8,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1.5px rgba(0,0,0,0.4), 0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div className='h-[22px] bg-[#2a2a2c] rounded-t-[6px] flex items-center px-2.5 gap-1.5 mb-px'>
          <div className='w-2.5 h-2.5 rounded-full bg-[#ff5f57]' />
          <div className='w-2.5 h-2.5 rounded-full bg-[#febc2e]' />
          <div className='w-2.5 h-2.5 rounded-full bg-[#28c840]' />
          <div className='flex-1 mx-3 bg-[#3a3a3c] rounded h-3.5 flex items-center px-2'>
            <span className='text-[8px] text-white/35 font-mono truncate'>
              {displayUrl}
            </span>
          </div>
        </div>
        <div
          ref={screenRef}
          className='rounded-b-[6px] overflow-hidden bg-background relative border border-[#3a3a3c]'
          style={{ height: DESKTOP_SCREEN_H }}
        >
          {loading && (
            <div className='absolute inset-0 bg-background z-10 flex items-center justify-center'>
              <div className='w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin' />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className='border-none block w-full h-full'
            title={`Démo ${theme}`}
            onLoad={onLoad}
          />
        </div>
      </div>
      <div
        className='mx-auto'
        style={{
          width: Math.round(screenW * 0.2),
          height: 18,
          background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)",
          clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
        }}
      />
      <div
        className='mx-auto'
        style={{
          width: Math.round(screenW * 0.25),
          height: 8,
          background: "linear-gradient(180deg, #3a3a3c, #2a2a2c)",
          borderRadius: "0 0 4px 4px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

export function ProductDemoViewer() {
  const t = useTranslations("ProductDemo");
  const [activeAnimation, setActiveAnimation] =
    useState<AnimationKey>("envelope");
  const [activeTheme, setActiveTheme] = useState<ThemeKey>("floral");
  const [device, setDevice] = useState<"mobile" | "desktop" | null>(null);

  // Detect device once on mount to avoid layout shift (from mobile-first default)
  useEffect(() => {
    setDevice(window.innerWidth >= DESKTOP_VIEWPORT ? "desktop" : "mobile");
  }, []);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Simple IntersectionObserver to trigger play when visible
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true);
          iframeRef.current?.contentWindow?.postMessage(
            { type: "PLAY_INTRO" },
            window.location.origin,
          );
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasTriggered]);

  // Reset trigger when animation changes so it can play again if remounted/re-scrolled?
  // Actually, usually we want it to play once when it appears.
  // But if the user switches animation, the iframe reloads.
  // Let's reset hasTriggered when activeAnimation changes so the new iframe gets the play command.
  useEffect(() => {
    setHasTriggered(false);
  }, [activeAnimation, device]);

  // Sync state upward from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Validate origin if possible; allow "*" since iframe and window share origin but just to be safe
      if (e.data?.type === "SYNC_ANIMATION" && e.data?.animation) {
        setActiveAnimation(e.data.animation);
      }
      if (e.data?.type === "SYNC_THEME" && e.data?.theme) {
        setActiveTheme(e.data.theme);
      }
      if (
        e.data?.type === "SYNC_DEVICE" &&
        (e.data?.device === "mobile" || e.data?.device === "desktop")
      ) {
        setDevice(e.data.device);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const [hasCustomized, setHasCustomized] = useState(false);

  useEffect(() => {
    if (activeAnimation !== "envelope" || activeTheme !== "floral") {
      setHasCustomized(true);
    }
  }, [activeAnimation, activeTheme]);

  const iframeUrl = `/fr/invitation/${DEMO_CODES[activeAnimation]}?demo=true&device=${device || "mobile"}${!hasCustomized ? "&hint=true" : ""}`;

  const sendTheme = useCallback(
    (
      theme: ThemeKey,
      animation: AnimationKey,
      ref?: React.RefObject<HTMLIFrameElement | null>,
    ) => {
      const iframe = (ref ?? iframeRef).current;
      if (!iframe?.contentWindow) return;
      iframe.contentWindow.postMessage(
        {
          type: "SET_THEME",
          theme,
          device,
          heroAsset: THEME_HERO_ASSETS[theme],
          animationSequence: ANIMATION_SEQUENCES[animation],
        },
        window.location.origin,
      );
    },
    [device],
  );

  // Lock body scroll when fullscreen is open
  useEffect(() => {
    if (fullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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
    const timeout = setTimeout(
      () => sendTheme(activeTheme, activeAnimation),
      300,
    );
    return () => clearTimeout(timeout);
  }, [activeTheme, activeAnimation, sendTheme, device]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    setTimeout(() => sendTheme(activeTheme, activeAnimation), 100);

    // If we're already in view when the iframe loads, trigger playback
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom > 0;
      if (isInView) {
        setHasTriggered(true);
        iframeRef.current?.contentWindow?.postMessage(
          { type: "PLAY_INTRO" },
          window.location.origin,
        );
      }
    }
  }, [sendTheme, activeTheme, activeAnimation, device]);

  return (
    <div ref={containerRef}>
      {/* Header */}
      <div className='text-center '>
        <p className='text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3'>
          {t("demosEyebrow")}
        </p>
        <h2 className='font-heading text-4xl md:text-5xl font-medium text-foreground leading-tight'>
          Découvrez le faire-part{" "}
          <span className='italic text-primary'>en direct</span>
        </h2>
        <p className='text-muted-foreground mt-4 max-w-xl mx-auto text-balance'>
          Choisissez un thème et explorez une vraie invitation — comme la
          vivrait l'un de vos invités.
        </p>
      </div>

      {/* Device frame */}
      {device === null ? (
        <div className="flex justify-center w-full py-10">
          <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : device === "mobile" ? (
        <MobileFrame
          iframeUrl={iframeUrl}
          iframeRef={iframeRef}
          theme={THEME_LABELS[activeTheme]}
          loading={iframeLoading}
          onLoad={handleIframeLoad}
        />
      ) : (
        <div className='max-w-3xl mx-auto mt-10 w-full'>
          <DesktopFrame
            iframeUrl={iframeUrl}
            iframeRef={iframeRef}
            theme={THEME_LABELS[activeTheme]}
            loading={iframeLoading}
            onLoad={handleIframeLoad}
          />
        </div>
      )}

      {/* Device toggle + fullscreen — below the frame */}
      <div className='flex flex-col items-center gap-3 mt-10'>
        <button
          onClick={() => setFullscreen(true)}
          className='flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 text-primary text-sm font-medium bg-card hover:bg-primary/5 transition-colors shadow-sm'
        >
          <Expand className='w-3.5 h-3.5' />
          {t("openFullscreen")}
        </button>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className='fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-center justify-center'>
          <button
            onClick={() => setFullscreen(false)}
            className='absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shadow-lg transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
          <div className='w-full h-full'>
            <iframe
              ref={fullscreenIframeRef}
              src={iframeUrl}
              className='w-full h-full border-none block'
              title={`Démo ${THEME_LABELS[activeTheme]} plein écran`}
              onLoad={() =>
                setTimeout(
                  () =>
                    sendTheme(
                      activeTheme,
                      activeAnimation,
                      fullscreenIframeRef,
                    ),
                  100,
                )
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

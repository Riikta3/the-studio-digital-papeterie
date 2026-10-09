"use client";

import { cn } from "@shared/lib/utils";
import { BatteryFull, Signal, Wifi } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { type Theme, themeDemoPath } from "./themes";

// iPhone 15 Pro-style proportions: 390×844pt screen, titanium rim and
// thin black bezel around it. The frame renders at this fixed size and
// is scaled down to fit its container.
const SCREEN_W = 390;
const SCREEN_H = 844;
const RIM = 3;
const BEZEL = 10;
/** The status bar sits above the invitation, as in a browser; the iframe starts below it. */
const STATUS_BAR_H = 50;
const PHONE_W = SCREEN_W + 2 * (RIM + BEZEL);
const PHONE_H = SCREEN_H + 2 * (RIM + BEZEL);

function PhoneScreen({ theme }: { theme: Theme }) {
  const t = useTranslations("Preview");
  const locale = useLocale();
  // Follows the carousel selection: each theme renders its own demo route.
  const demoUrl = themeDemoPath(locale, theme.id);
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState("");

  // The iframe remounts when the theme changes (see its `key`), so the spinner
  // has to come back with it — `loading` lives on this component, which does not
  // remount.
  useEffect(() => {
    setLoading(true);
  }, [demoUrl]);

  // Live clock in the status bar, refreshed every minute.
  useEffect(() => {
    const formatTime = () =>
      new Date().toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    setTime(formatTime());
    const interval = setInterval(() => setTime(formatTime()), 30_000);
    return () => clearInterval(interval);
  }, []);

  // Forward mouse wheel events into the iframe so the invitation scrolls
  // as if the phone screen were a real touch surface.
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
  }, []);

  return (
    <div
      ref={screenRef}
      className="relative overflow-hidden rounded-[55px] bg-studio-beurre"
      style={{ width: SCREEN_W, height: SCREEN_H }}
    >
      {/* Status bar, on the colour of the theme's top edge */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-10 pt-1.5",
          theme.statusBar.text === "light" ? "text-white" : "text-studio-violet",
        )}
        style={{ height: STATUS_BAR_H, background: theme.statusBar.background }}
      >
        <span className="font-body text-sm font-semibold tracking-wide">
          {time}
        </span>
        <span className="flex items-center gap-1.5">
          <Signal className="h-3.5 w-3.5" strokeWidth={2.5} />
          <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
          <BatteryFull className="h-4 w-4" strokeWidth={2} />
        </span>
      </div>

      {/* Dynamic Island */}
      <div className="absolute left-1/2 top-[11px] z-20 flex h-[34px] w-[122px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3">
        <div className="h-3 w-3 rounded-full bg-[#1a1a1c] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]" />
      </div>

      {/* Home indicator */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 h-[5px] w-[130px] -translate-x-1/2 rounded-full bg-white/80" />

      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-studio-beurre">
          <div className="h-8 w-8 animate-spin rounded-full border border-studio-violet/30 border-t-studio-violet" />
        </div>
      )}
      <iframe
        // Remount on theme change: without a key React keeps the same iframe
        // and swapping `src` would push an entry onto its history instead of
        // replacing the page.
        key={demoUrl}
        ref={iframeRef}
        src={demoUrl}
        className="absolute inset-x-0 block w-full border-none"
        style={{ top: STATUS_BAR_H, height: SCREEN_H - STATUS_BAR_H }}
        title={t("demoIframeTitle", { name: theme.name })}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}

/**
 * The phone mockup that loads a theme's demo — the home page's preview and
 * the studio's « Voir la démo » both draw it.
 *
 * `fitHeight` also caps the phone to the window's height (less that many
 * pixels), for a dialog where a full-width phone would run off the screen.
 */
export function PhoneFrame({ theme, fitHeight }: { theme: Theme; fitHeight?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // null until measured on the client → avoids SSR/client mismatch.
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () =>
      setScale(
        Math.min(
          1,
          el.clientWidth / PHONE_W,
          fitHeight === undefined ? 1 : (window.innerHeight - fitHeight) / PHONE_H,
        ),
      );
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [fitHeight]);

  return (
    <div
      ref={wrapRef}
      className="mx-auto w-full max-w-[340px] md:max-w-[416px]"
    >
      {scale !== null && (
        <div
          className="relative mx-auto"
          style={{ height: PHONE_H * scale, width: PHONE_W * scale }}
        >
          {/* Titanium rim */}
          <div
            className="absolute left-0 top-0"
            style={{
              width: PHONE_W,
              height: PHONE_H,
              padding: RIM,
              borderRadius: 68,
              background:
                "linear-gradient(145deg, #6a6a6e 0%, #3a3a3d 25%, #2a2a2d 60%, #55555a 100%)",
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.4), 0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.18)",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {/* Hardware buttons on the titanium band */}
            <div className="absolute left-[-2.5px] top-[175px] h-[26px] w-[3px] rounded-l-sm bg-gradient-to-b from-[#55555a] via-[#3a3a3d] to-[#55555a]" />
            <div className="absolute left-[-2.5px] top-[235px] h-[52px] w-[3px] rounded-l-sm bg-gradient-to-b from-[#55555a] via-[#3a3a3d] to-[#55555a]" />
            <div className="absolute left-[-2.5px] top-[300px] h-[52px] w-[3px] rounded-l-sm bg-gradient-to-b from-[#55555a] via-[#3a3a3d] to-[#55555a]" />
            <div className="absolute right-[-2.5px] top-[260px] h-[84px] w-[3px] rounded-r-sm bg-gradient-to-b from-[#55555a] via-[#3a3a3d] to-[#55555a]" />

            {/* Black bezel */}
            <div
              className="h-full w-full"
              style={{ padding: BEZEL, borderRadius: 65, background: "#000" }}
            >
              <PhoneScreen theme={theme} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

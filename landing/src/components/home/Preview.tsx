"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BatteryFull,
  Signal,
  Wifi,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { FadeIn } from "./FadeIn";

// Once the demo invitation route exists in this app, point this at it
// (e.g. "/fr/invitation/demo?demo=true") and the phone screen becomes a
// real scrollable iframe instead of the static theme image.
const DEMO_INVITATION_URL: string | null = null;

// iPhone 15 Pro-style proportions: 390×844pt screen, titanium rim and
// thin black bezel around it. The frame renders at this fixed size and
// is scaled down to fit its container.
const SCREEN_W = 390;
const SCREEN_H = 844;
const RIM = 3;
const BEZEL = 10;
const PHONE_W = SCREEN_W + 2 * (RIM + BEZEL);
const PHONE_H = SCREEN_H + 2 * (RIM + BEZEL);

const THEMES = [
  { name: "Amalfi", image: "/images/invitation-amalfi.png" },
  { name: "Venise", image: "/images/invitation-venise.png" },
  { name: "Provence", image: "/images/invitation-provence.png" },
  { name: "Toscane", image: "/images/invitation-toscane.png" },
  { name: "Riviera", image: "/images/invitation-riviera.png" },
  { name: "Capri", image: "/images/invitation-capri.png" },
];

type Theme = (typeof THEMES)[number];

function PhoneScreen({ theme }: { theme: Theme }) {
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState("");

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
    if (!DEMO_INVITATION_URL) return;
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
      {/* Status bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-10 pt-4 text-white drop-shadow">
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

      {DEMO_INVITATION_URL ? (
        <>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-studio-beurre">
              <div className="h-8 w-8 animate-spin rounded-full border border-studio-violet/30 border-t-studio-violet" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={DEMO_INVITATION_URL}
            className="block h-full w-full border-none"
            title={`Démo invitation — thème ${theme.name}`}
            onLoad={() => setLoading(false)}
          />
        </>
      ) : (
        <>
          <Image
            src={theme.image}
            alt={`Invitation de mariage — thème ${theme.name}`}
            fill
            sizes="390px"
            className="object-cover"
            priority
          />
          <span className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 font-body text-xs uppercase tracking-luxe text-white drop-shadow">
            Scroll
          </span>
        </>
      )}
    </div>
  );
}

function PhoneFrame({ theme }: { theme: Theme }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // null until measured on the client → avoids SSR/client mismatch.
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setScale(Math.min(1, el.clientWidth / PHONE_W));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="mx-auto w-full max-w-[340px] md:max-w-[416px]">
      {scale !== null && (
        <div className="relative" style={{ height: PHONE_H * scale }}>
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

function ThemeCarousel({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  return (
    // Full-bleed: escape the section's horizontal padding so the track
    // runs edge to edge, with cards cropped at the viewport sides.
    <div className="relative -mx-6 md:-mx-12">
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label="Thèmes précédents"
        className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 md:left-8"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x gap-4 overflow-x-auto px-6 py-2 md:px-12"
      >
        {THEMES.map((theme, index) => (
          <button
            key={theme.name}
            type="button"
            onClick={() => onSelect(index)}
            className="w-32 shrink-0 snap-start text-center md:w-36"
          >
            <div
              className={cn(
                "relative aspect-[290/540] overflow-hidden rounded-xl transition-shadow",
                index === active &&
                  "ring-2 ring-studio-violet ring-offset-2 ring-offset-studio-creme",
              )}
            >
              <Image
                src={theme.image}
                alt={`Thème ${theme.name}`}
                fill
                sizes="144px"
                className="object-cover"
              />
            </div>
            <p className="mt-2 font-body text-h5 text-studio-violet">
              Thème {theme.name}
            </p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label="Thèmes suivants"
        className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 md:right-8"
      >
        <ArrowRight className="h-5 w-5" />
      </button>

      <div className="mt-4 flex justify-center gap-2">
        {THEMES.map((theme, index) => (
          <span
            key={theme.name}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === active
                ? "w-6 bg-studio-violet"
                : "w-1.5 bg-studio-lavande/60",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function Preview() {
  const [activeTheme, setActiveTheme] = useState(0);

  return (
    <section className="bg-studio-creme px-6 py-20 md:px-12">
      <FadeIn className="mx-auto mb-12 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>Configurez en direct</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          Explorez
          <br />
          <span className="text-studio-lavande">chaque création</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md font-body text-sm text-studio-violet/70 md:text-base">
          Essayez chaque thème et trouvez celui qui raconte votre histoire.
        </p>
      </FadeIn>

      <FadeIn
        amount={0.15}
        className="relative mx-auto w-full max-w-[340px] md:max-w-[416px]"
      >
        <Image
          src="/images/leaf-top-lavande.svg"
          alt=""
          width={82}
          height={138}
          className="pointer-events-none absolute -right-10 top-2 h-auto w-20 md:-right-16 md:w-28"
        />
        <Image
          src="/images/leaf-bottom-lavande.svg"
          alt=""
          width={106}
          height={188}
          className="pointer-events-none absolute -left-12 bottom-16 h-auto w-24 md:-left-20 md:w-32"
        />
        <PhoneFrame theme={THEMES[activeTheme]} />
      </FadeIn>

      <FadeIn className="mt-10 flex flex-row justify-center gap-3 sm:gap-4">
        <Button
          variant="studio-outline"
          size="pill"
          className="border-studio-violet text-studio-violet hover:bg-studio-violet/10"
        >
          Découvrir
        </Button>
        <Button variant="studio-jaune" size="pill">
          Créer mon invitation <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </FadeIn>

      <FadeIn className="mt-14">
        <ThemeCarousel active={activeTheme} onSelect={setActiveTheme} />
      </FadeIn>
    </section>
  );
}

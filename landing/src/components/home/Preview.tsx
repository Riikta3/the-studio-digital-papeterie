"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { ArrowLeft, ArrowRight, BatteryFull, Signal, Wifi } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Link } from "@/navigation";

import { FadeIn } from "./FadeIn";
import { THEMES, type Theme, themeDemoPath } from "./themes";
import { UpcomingThemeCard } from "./UpcomingThemeCard";
import { ThemeConfigSheet } from "./ThemeConfigSheet";

// iPhone 15 Pro-style proportions: 390×844pt screen, titanium rim and
// thin black bezel around it. The frame renders at this fixed size and
// is scaled down to fit its container.
const SCREEN_W = 390;
const SCREEN_H = 844;
const RIM = 3;
const BEZEL = 10;
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
        className="block h-full w-full border-none"
        title={t("demoIframeTitle", { name: theme.name })}
        onLoad={() => setLoading(false)}
      />
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
    <div
      ref={wrapRef}
      className="mx-auto w-full max-w-[340px] md:max-w-[416px]"
    >
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

// Repeat the theme list so the track always has cards to scroll into in
// either direction; combined with the silent re-centering below, this reads
// as an infinite loop even though the underlying scroller is finite.
const LOOP_REPEATS = 5;
const MIDDLE_SET = Math.floor(LOOP_REPEATS / 2);
// Each repeat ends with the "more coming" card, so it travels with the loop
// instead of appearing once at one end of an infinite scroller. `index: null`
// marks it unselectable.
const LOOPED_THEMES = Array.from({ length: LOOP_REPEATS }, (_, set) => [
  ...THEMES.map((theme, index) => ({
    theme,
    index,
    key: `${set}-${theme.name}`,
  })),
  { theme: null, index: null, key: `${set}-upcoming` },
]).flat();

function ThemeCarousel({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("Preview");
  const trackRef = useRef<HTMLDivElement>(null);
  const cardStepRef = useRef(0);

  // Start scrolled into the middle repeat so there's room to scroll both
  // ways from the first paint.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | undefined;
    const step = (card?.offsetWidth ?? 0) + 16; // 16 = gap-4
    cardStepRef.current = step;
    el.scrollLeft = step * THEMES.length * MIDDLE_SET;
  }, []);

  // Once the user scrolls within one set's width of either end, silently
  // (no smooth-scroll) jump back by exactly one repeat's width — invisible
  // to the user since the content at that offset is identical.
  const handleScroll = () => {
    const el = trackRef.current;
    const step = cardStepRef.current;
    if (!el || !step) return;
    const setWidth = step * THEMES.length;
    if (el.scrollLeft < setWidth) {
      el.scrollLeft += setWidth * (LOOP_REPEATS - 2);
    } else if (el.scrollLeft > setWidth * (LOOP_REPEATS - 1)) {
      el.scrollLeft -= setWidth * (LOOP_REPEATS - 2);
    }
  };

  const scrollByCard = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  return (
    // Full-bleed on mobile: escape the section's horizontal padding so the
    // track runs edge to edge, with cards cropped at the viewport sides.
    // On desktop it's capped and centered instead of spanning the full width.
    <div className="relative -mx-6 md:mx-auto md:max-w-[75vw]">
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        aria-label={t("prevThemesAriaLabel")}
        className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 md:left-8"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex snap-x gap-4 overflow-x-auto px-6 py-2 md:px-12"
      >
        {LOOPED_THEMES.map(({ theme, index, key }) =>
          theme === null || index === null ? (
            <div
              key={key}
              className="w-32 shrink-0 snap-start text-center md:w-36"
            >
              <div className="relative aspect-[290/540]">
                <UpcomingThemeCard />
              </div>
              {/* Spacer, not a label: it keeps this card's artwork aligned with
                  the themed ones, whose names sit on this line. */}
              <p aria-hidden="true" className="mt-2 font-body text-h5">
                &nbsp;
              </p>
            </div>
          ) : (
            <button
              key={key}
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
                  alt={t("themeLabel", { name: theme.name })}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              </div>
              <p className="mt-2 font-body text-h5 text-studio-violet">
                {t("themeLabel", { name: theme.name })}
              </p>
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => scrollByCard(1)}
        aria-label={t("nextThemesAriaLabel")}
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
  const t = useTranslations("Preview");
  const [activeTheme, setActiveTheme] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <section id="demo" className="bg-studio-creme px-6 py-20 md:px-12">
      <FadeIn className="mx-auto mb-12 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>{t("eyebrow")}</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          {t("titleLine1")}
          <br />
          <span className="text-studio-lavande">{t("titleAccent")}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md font-body text-sm text-studio-violet/70 md:text-base">
          {t("subtitle")}
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
          onClick={() => setConfigOpen(true)}
        >
          {t("discoverButton")}
        </Button>
        <Button variant="studio-jaune" size="pill" asChild>
          <Link href="/studio/start">
            {t("createButton")} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </FadeIn>

      <FadeIn className="mt-14">
        <ThemeCarousel active={activeTheme} onSelect={setActiveTheme} />
      </FadeIn>

      <ThemeConfigSheet
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        themeName={THEMES[activeTheme].name}
        themeImage={THEMES[activeTheme].image}
        onSave={(config) => console.log("Theme config saved:", config)}
      />
    </section>
  );
}

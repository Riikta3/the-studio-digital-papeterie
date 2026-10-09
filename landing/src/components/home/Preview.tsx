"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Link } from "@/navigation";

import { FadeIn } from "./FadeIn";
import { PhoneFrame } from "./PhoneFrame";
import {
  setSelectedThemeIndex,
  useSelectedThemeIndex,
} from "./selected-theme";
import { THEMES } from "./themes";
import { UpcomingThemeCard } from "./UpcomingThemeCard";
import { ThemeConfigSheet } from "./ThemeConfigSheet";

// One set = every theme, then the "more coming" card that closes the row.
const CARD_SET = [
  ...THEMES.map((theme, index) => ({ theme, index })),
  { theme: null, index: null },
];

// Each theme once, never repeated: a looping row printed the same covers
// two or three times side by side on a wide screen. The row scrolls when it
// is wider than the screen, and the arrows say so.
const CARDS = CARD_SET.map(({ theme, index }) => ({
  theme,
  index,
  key: theme?.id ?? "upcoming",
}));

function ThemeCarousel({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const t = useTranslations("Preview");
  const trackRef = useRef<HTMLDivElement>(null);

  // Whether the track actually overflows. With only a few themes a desktop
  // screen fits every card, and then the arrows and the dots point at nothing —
  // and the row, left-aligned, sits against a wide empty gutter.
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollWidth > el.clientWidth + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
        className={cn(
          "absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 md:left-8",
          !overflows && "hidden",
        )}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div
        ref={trackRef}
        className={cn(
          "scrollbar-hide flex snap-x gap-4 overflow-x-auto px-6 py-2 md:px-12",
          // Only centre when everything fits: `justify-center` on an
          // overflowing flex row makes its leading items unreachable, because
          // the overflow is split to both sides of the scroll origin.
          overflows ? "justify-start" : "justify-center",
        )}
      >
        {CARDS.map(({ theme, index, key }) =>
          theme === null || index === null ? (
            <div
              key={key}
              className="w-32 shrink-0 snap-start text-center md:w-36"
            >
              <div className="relative aspect-[290/540]">
                <UpcomingThemeCard
                  title={t("upcomingTitle")}
                  subtitle={t("upcomingSubtitle")}
                />
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
                {/* Decorative: the theme name is already the visible caption
                    directly below, so an alt repeating it makes a screen
                    reader announce the same words twice. */}
                <Image
                  src={theme.image}
                  alt=""
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
        className={cn(
          "absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 md:right-8",
          !overflows && "hidden",
        )}
      >
        <ArrowRight className="h-5 w-5" />
      </button>

      <div
        className={cn("mt-4 flex justify-center gap-2", !overflows && "hidden")}
      >
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
  // Shared with the hero: its fan and this carousel select the same theme, so
  // arriving here via "Tester le thème X" lands on X already loaded.
  const activeTheme = useSelectedThemeIndex();
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <section id="demo" className="relative overflow-hidden bg-studio-creme px-6 py-20 md:px-12">
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

      {/* Scroll target for the hero's "Tester le thème X" button: landing on
          the phone itself, not the section title, so the preview is what the
          visitor sees when the scroll settles. */}
      <FadeIn
        id="demo-phone"
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

      {/* mt-20, not mt-10: the phone's drop shadow (0 32px 80px) reaches
          roughly 72px below the frame, and at mt-10 the buttons sat inside
          that grey wash. Clearing the shadow rather than shrinking it keeps
          the phone looking like it rests on the page. */}
      <FadeIn className="mt-20 flex w-full flex-col items-stretch gap-3 px-6 sm:flex-row sm:justify-center sm:gap-4">
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
        <ThemeCarousel active={activeTheme} onSelect={setSelectedThemeIndex} />
      </FadeIn>

      <ThemeConfigSheet
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        themeId={THEMES[activeTheme].id}
        themeName={THEMES[activeTheme].name}
      />
    </section>
  );
}

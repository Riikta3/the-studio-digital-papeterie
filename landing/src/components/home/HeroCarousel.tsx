"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { THEMES } from "./themes";

const GAP = 10;

const CARD_COUNT = THEMES.length;

// The reference card the intro slides to and highlights: the middle of the
// fan, so it holds however many themes ship.
const REFERENCE_INDEX = Math.floor(CARD_COUNT / 2);

// How many extra steps to the right the band starts before sliding left.
const INTRO_OVERSHOOT = 2;

// How much the active card grows at rest.
const ACTIVE_SCALE = 1.2;

// Card aspect ratio (w/h) — portrait, smartphone-like.
const CARD_RATIO = 290 / 540;

export function HeroCarousel({
  onActiveThemeChange,
}: {
  onActiveThemeChange?: (themeIndex: number) => void;
} = {}) {
  const t = useTranslations("HeroCarousel");
  // Honoured for the grow/shrink only — the rest of this page's motion predates
  // this change and is left as is rather than altered in passing.
  const reduceMotion = useReducedMotion();
  const cardAlts = t.raw("cards") as { alt: string }[];
  // "intro" = one-shot slide-in; "idle" = manual carousel.
  const [phase, setPhase] = useState<"intro" | "idle">("intro");
  // Unbounded counter → infinite swipe in both directions.
  const [position, setPosition] = useState(REFERENCE_INDEX);

  const activeCardId = ((position % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;

  // Reported on every change, including during the intro: the hero's CTA names
  // this theme, so the name has to be right before the fan settles — not only
  // after the first manual swipe.
  useEffect(() => {
    onActiveThemeChange?.(activeCardId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCardId]);

  // Measure the viewport so card size scales down on narrow screens and the
  // grown active card never exceeds the clipping container (no crop).
  const viewportRef = useRef<HTMLDivElement>(null);
  // null until measured on the client → avoids SSR/client geometry mismatch.
  const [dims, setDims] = useState<{ cardW: number; cardH: number } | null>(
    null,
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => {
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      // Reserve room so scale(ACTIVE_SCALE) fits inside the clip box, plus an
      // extra margin so resting cards are smaller and the grown active card
      // keeps some breathing space (never touches the edges → no crop).
      const maxH = (vh * 0.82) / ACTIVE_SCALE;
      // Keep the active card within the viewport width too, with a little margin.
      const maxW = (vw * 0.78) / ACTIVE_SCALE;
      let cardH = maxH;
      let cardW = cardH * CARD_RATIO;
      if (cardW > maxW) {
        cardW = maxW;
        cardH = cardW / CARD_RATIO;
      }
      setDims({ cardW, cardH });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardW = dims?.cardW ?? 0;
  const cardH = dims?.cardH ?? 0;
  const step = cardW + GAP;

  const goTo = (direction: -1 | 1) => {
    setPosition((prev) => prev + direction);
  };

  // Translate the whole track so the active position sits centered.
  const restX = -position * step;
  const introFromX = -(REFERENCE_INDEX - INTRO_OVERSHOOT) * step;

  return (
    <div className="relative flex w-full items-center justify-center">
      <button
        type="button"
        onClick={() => goTo(-1)}
        aria-label={t("prevAriaLabel")}
        className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 disabled:opacity-0 md:left-8"
        disabled={phase !== "idle"}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div
        ref={viewportRef}
        className="relative flex h-[620px] w-full items-center justify-center overflow-hidden md:h-[720px]"
      >
        {/* The sliding track: real side-by-side cards, one shared x transform.
            Anchored so its left edge sits at the viewport center; the negative
            restX then pulls the active card back to the center.
            Rendered only once measured on the client → no hydration mismatch. */}
        {dims && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-0 w-0"
            initial={{ x: introFromX }}
            animate={{ x: restX }}
            transition={
              phase === "intro"
                ? { duration: 2.2, delay: 0.2, ease: [0.45, 0, 0.65, 0.3] }
                : { type: "spring", stiffness: 180, damping: 26 }
            }
            onAnimationComplete={() => {
              if (phase === "intro") setPhase("idle");
            }}
          >
            {/* Render enough repeats around the current position for infinite feel.
              The window is re-centered on `position` every render (not a fixed
              range around 0), so it keeps following the user however far they
              swipe/click in either direction — true infinite scroll. */}
            {Array.from({ length: CARD_COUNT * 5 }, (_, k) => {
              const trackIndex = position - CARD_COUNT * 2 + k; // spans below & above current
              const cardId =
                ((trackIndex % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
              // During intro nothing is highlighted; at rest only the centered one.
              const isActive = phase === "idle" && trackIndex === position;

              return (
                <motion.div
                  // Keyed on the track slot, not on `k`. The rendered window is
                  // re-centred on `position` every render, so `k` addresses a
                  // different card after each step: React would keep the same
                  // node and swap its image, leaving Framer nothing to animate —
                  // the active card's scale jumped straight from 1 to 1.2 with no
                  // frames in between. `trackIndex` is a card's stable identity,
                  // so growing and shrinking are transitions on one element.
                  key={trackIndex}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    scale: isActive ? ACTIVE_SCALE : 1,
                    zIndex: isActive ? 10 : 1,
                  }}
                  transition={{
                    opacity: { duration: 0.2, ease: "easeOut" },
                    // Grow and shrink together on a soft spring: the card the
                    // user leaves eases down while the new one eases up.
                    scale: reduceMotion
                      ? { duration: 0 }
                      : {
                          type: "spring",
                          stiffness: 260,
                          damping: 30,
                          mass: 0.9,
                        },
                    // zIndex must not interpolate, or the shrinking card floats
                    // over the growing one through fractional values.
                    zIndex: { duration: 0 },
                  }}
                  className="absolute overflow-hidden rounded-3xl"
                  style={{
                    width: cardW,
                    height: cardH,
                    left: trackIndex * step - cardW / 2,
                    top: "50%",
                    marginTop: -cardH / 2,
                  }}
                >
                  <Image
                    src={THEMES[cardId].image}
                    alt={cardAlts[cardId]?.alt ?? ""}
                    fill
                    sizes="(max-width: 768px) 60vw, 290px"
                    className="object-cover"
                    priority={cardId === REFERENCE_INDEX}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <button
        type="button"
        onClick={() => goTo(1)}
        aria-label={t("nextAriaLabel")}
        className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 disabled:opacity-0 md:right-8"
        disabled={phase !== "idle"}
      >
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}

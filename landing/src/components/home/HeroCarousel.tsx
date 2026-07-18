"use client";

import { motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const SWIPE_THRESHOLD = 40;

const GAP = 10;

const CARD_IMAGE_SRCS = [
  "/images/invitation-amalfi.png",
  "/images/invitation-venise.png",
  "/images/invitation-provence.png",
  "/images/invitation-toscane.png",
  "/images/invitation-riviera.png",
  "/images/invitation-capri.png",
];
const CARD_COUNT = CARD_IMAGE_SRCS.length;

// The reference card the intro slides to and highlights.
const REFERENCE_INDEX = 3;

// How many extra steps to the right the band starts before sliding left.
const INTRO_OVERSHOOT = 2;

// How much the active card grows at rest.
const ACTIVE_SCALE = 1.2;

// Card aspect ratio (w/h) — portrait, smartphone-like.
const CARD_RATIO = 290 / 540;

export function HeroCarousel() {
  const t = useTranslations("HeroCarousel");
  const cardAlts = t.raw("cards") as { alt: string }[];
  // "intro" = one-shot slide-in; "idle" = manual carousel.
  const [phase, setPhase] = useState<"intro" | "idle">("intro");
  // Unbounded counter → infinite swipe in both directions.
  const [position, setPosition] = useState(REFERENCE_INDEX);

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

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (phase !== "idle") return;
    if (info.offset.x < -SWIPE_THRESHOLD) {
      goTo(1);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      goTo(-1);
    }
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
          className="absolute left-1/2 top-1/2 h-0 w-0 touch-pan-y"
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
          drag={phase === "idle" ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={handleDragEnd}
        >
          {/* Render enough repeats around the current position for infinite feel. */}
          {Array.from({ length: CARD_COUNT * 5 }, (_, k) => {
            const trackIndex = k - CARD_COUNT * 2; // spans below & above current
            const cardId =
              ((trackIndex % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
            // During intro nothing is highlighted; at rest only the centered one.
            const isActive = phase === "idle" && trackIndex === position;

            return (
              <motion.div
                key={k}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  scale: isActive ? ACTIVE_SCALE : 1,
                  zIndex: isActive ? 10 : 1,
                }}
                transition={{
                  opacity: { duration: 0.2, ease: "easeOut" },
                  scale: { duration: 0.5, ease: "easeOut" },
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
                  src={CARD_IMAGE_SRCS[cardId]}
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

"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { cn } from "@shared/lib/utils";

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

// Flick velocity (px/s) past which a release carries beyond the card it was
// let go over, the way a native scroller's inertia does. Below it, the release
// simply commits to the nearest card.
const FLICK_VELOCITY = 400;

// A hard flick can carry more than one card, but not without limit — an
// accidental fast swipe should not spin the fan halfway around.
const MAX_FLICK_CARDS = 2;

// Resistance applied to the drag: the track moves slightly less than the
// finger, which reads as weight rather than as lag.
const DRAG_ELASTIC = 0.85;

// The spring the track settles on after a release. Shared with arrow clicks so
// both inputs feel like one carousel.
const SETTLE_SPRING = { type: "spring", stiffness: 180, damping: 26 } as const;

// The intro's one-shot slide-in.
const INTRO_TRANSITION = {
  duration: 2.2,
  delay: 0.2,
  ease: [0.45, 0, 0.65, 0.3],
} as const;

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

  // Translate the whole track so the active position sits centered.
  const restX = -position * step;

  // The track's x is owned here rather than declared as `animate={{ x }}`.
  // A declarative target fights the gesture: the active card's scale is
  // state-driven, so the component re-renders mid-drag, and each render would
  // re-assert `x: restX` and snap the track out from under the finger. Owning
  // the value means Framer's drag writes straight to it and only the release
  // animates.
  const x = useMotionValue(0);
  // True from pointer-down to release. `position` changes during a drag (the
  // card under the finger grows live), and the settle effect must not spring
  // the track while the finger still holds it.
  const draggingRef = useRef(false);
  // The track starts at the intro's offset, which is a jump, not a transition:
  // there is no previous value to animate from.
  const placedRef = useRef(false);

  // The intro slide-in, run once the viewport has been measured.
  //
  // Deliberately separate from the settle effect below, and depending on
  // neither `position` nor `restX`: the ResizeObserver fires a second time
  // just after mount with the measured `step`, and an effect that also handled
  // the settle would then re-run mid-intro, call `animate` again and cancel
  // the intro. Framer resolves a cancelled animation's promise as `false`
  // rather than running the `.then`, so `setPhase("idle")` never fired and the
  // carousel stayed frozen in its intro phase — arrows disabled, drag off.
  useEffect(() => {
    if (!step || phase !== "intro" || placedRef.current) return;

    placedRef.current = true;
    // Place the track at the overshoot offset, then animate away from it —
    // `animate` reads the value just set as its origin.
    x.set(-(REFERENCE_INDEX - INTRO_OVERSHOOT) * step);
    animate(x, -REFERENCE_INDEX * step, INTRO_TRANSITION).then(() =>
      setPhase("idle"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, phase]);

  // Every automatic move once the carousel is live: arrow clicks and the
  // settle after a release.
  useEffect(() => {
    // `step` is 0 until measured; during the intro the effect above owns `x`;
    // during a drag the finger does.
    if (!step || phase !== "idle" || draggingRef.current) return;

    animate(x, restX, SETTLE_SPRING);
    // `x` is a stable MotionValue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restX, step, phase]);

  const goTo = (direction: -1 | 1) => {
    setPosition((prev) => prev + direction);
  };

  const handleDragStart = () => {
    draggingRef.current = true;
  };

  // Move `position` as the drag crosses card boundaries so the centred card
  // grows and shrinks during the gesture, not only once it ends. `x` is
  // written by Framer's own drag handling, so the track still follows the
  // finger exactly.
  const handleDrag = () => {
    if (!step) return;
    const nearest = Math.round(-x.get() / step);
    setPosition((prev) => (prev === nearest ? prev : nearest));
  };

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    draggingRef.current = false;
    if (!step) return;

    const velocity = info.velocity.x;
    // Where the track actually sits, in fractional card units.
    const current = -x.get() / step;
    // Framer reports px/s: one extra card per FLICK_VELOCITY of it, capped,
    // and negated because dragging left (negative velocity) advances forward.
    const flickCards =
      Math.abs(velocity) > FLICK_VELOCITY
        ? Math.min(
            Math.round(Math.abs(velocity) / FLICK_VELOCITY),
            MAX_FLICK_CARDS,
          ) * -Math.sign(velocity)
        : 0;

    // Rounding is the half-step rule: whichever card the track is more than
    // halfway into is the one it commits to.
    const target = Math.round(current) + flickCards;

    // Changing `position` re-runs the settle effect, which springs x to match.
    // When the target is already `position` — a small drag that crossed no
    // boundary — that effect does not re-run, so spring it back by hand.
    if (target === position) {
      animate(x, restX, SETTLE_SPRING);
    } else {
      setPosition(target);
    }
  };

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

      {/* The fan itself is a decorative animation — the cards are images with
          no interactive role — so the change of active theme is announced here
          instead. Without it, arrowing through the carousel is silent: the
          buttons say "next"/"previous" and nothing reports what landed. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {t("activeThemeAnnouncement", { name: THEMES[activeCardId].name })}
      </p>

      <div
        ref={viewportRef}
        className={cn(
          "relative flex h-[620px] w-full items-center justify-center overflow-hidden md:h-[720px]",
          // `pan-y` hands vertical gestures to the browser (the page keeps
          // scrolling through the hero) while horizontal ones reach the drag.
          // Without it a mostly-horizontal swipe on iOS can still be claimed
          // as a page scroll and the carousel misses it.
          "touch-pan-y",
          // Only while the carousel is actually draggable: outside the gesture
          // there is no reason to suppress selection.
          phase === "idle" && "select-none cursor-grab active:cursor-grabbing",
        )}
      >
        {/* The sliding track: real side-by-side cards, one shared x transform.
            Anchored so its left edge sits at the viewport center; the negative
            restX then pulls the active card back to the center.
            Rendered only once measured on the client → no hydration mismatch. */}
        {dims && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-0 w-0"
            // `x` is driven by the effect above and by the drag, so there is no
            // `animate` prop here: a declarative target would overwrite the
            // gesture on every re-render.
            style={{ x }}
            // Horizontal only, so a vertical swipe still scrolls the page —
            // on a hero that fills the viewport, trapping the vertical gesture
            // would leave a phone unable to scroll past it.
            drag={phase === "idle" ? "x" : false}
            // The track is infinite, so there is nothing to constrain it to;
            // `dragElastic` alone then gives the drag its weight.
            dragConstraints={false}
            dragElastic={DRAG_ELASTIC}
            // Framer's own momentum is off: the release is resolved into a
            // card index and sprung there by `handleDragEnd`, and letting
            // inertia run as well would drift the track off-centre.
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
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
                    // Images are natively draggable: without this, a
                    // mouse-drag starts an HTML5 image drag instead of moving
                    // the carousel.
                    draggable={false}
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

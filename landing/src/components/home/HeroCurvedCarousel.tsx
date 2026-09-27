"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "framer-motion";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { cn } from "@shared/lib/utils";

import { THEMES } from "./themes";

/**
 * The hero's theme carousel, laid out on the inside of a cylinder.
 *
 * Same interaction model as `HeroCarousel` — infinite, swipe with a flick,
 * arrows, the one-shot intro — with three things added:
 *
 * - **Curvature.** Cards sit on an arc seen from inside it: the centre card
 *   faces the visitor flat, its neighbours turn in toward the middle and their
 *   outer edges come forward. Every card's transform is derived from the one
 *   shared `x`, so the bend follows the finger continuously during a drag
 *   instead of snapping when the active index changes.
 * - **A living centre card.** The card in front slowly scrolls down its
 *   theme's real invitation — a pre-rendered strip (`npm run
 *   themes:shoot-scroll`), not an iframe, so the first screen of the site does
 *   not load a whole theme to show a moving picture of it.
 * - **A name above.** `{ Belle Rive }`, changing as the carousel turns.
 *
 * The carousel advances by itself every `DWELL_MS`, and stops doing so the
 * moment the visitor touches it, hovers it, focuses it, scrolls it out of
 * view, switches tab, presses pause, or has asked their system for reduced
 * motion.
 *
 * ## Accessibility
 *
 * Follows the WAI-ARIA carousel pattern:
 * - a labelled region with a carousel role description, and a pause button —
 *   content that moves for more than five seconds must be stoppable (WCAG
 *   2.2.2), and hover alone is no control for keyboard or touch users;
 * - the live region is silent while the carousel turns by itself, and polite
 *   once the visitor drives it: announcing every automatic turn read out a
 *   theme name every nine seconds to someone who had not asked;
 * - only the card in front is exposed. The infinite track repeats the three
 *   themes, and a screen reader used to read eleven images for three themes;
 * - ← and → turn the carousel while focus is inside it.
 */

/**
 * How far the cylinder bends: the arc between two neighbouring cards, in
 * degrees, and the straight-line gap between them as a fraction of a card's
 * width.
 *
 * The gentlest of the three curves tried on a bench page (16°, 26°, 36°). The
 * stronger ones read as a tech-product reel — the reference this came from —
 * where a stationery brand wants the cards to lean in, not wrap around.
 */
const CURVE_ANGLE = 16;
const CURVE_GAP = 0.1;

/** Steepest turn allowed for the card at the edge of the screen, in degrees. */
const MAX_EDGE_ANGLE = 62;

/**
 * Below this width the curve is flattened. On a phone only one card and two
 * slivers fit, and a strong bend turns those slivers into edge-on strips that
 * read as glitches rather than as the next theme.
 */
const MOBILE_BREAKPOINT = 640;
const MOBILE_CURVE_FACTOR = 0.55;

const CARD_COUNT = THEMES.length;
const REFERENCE_INDEX = Math.floor(CARD_COUNT / 2);
const INTRO_OVERSHOOT = 2;

/** Card aspect ratio (w/h) — the cover images are 780x1452, i.e. 290:540. */
const CARD_RATIO = 290 / 540;

/** The strip each card scrolls: 640 px wide, see shoot-hero-scroll.mjs. */
const STRIP_RATIO = 640 / 8205;

/** How much bigger the centre card is than its neighbours. */
const ACTIVE_BOOST = 0.12;

/**
 * How much of the cylinder's depth is kept, 0 to 1.
 *
 * On a true inside-of-a-cylinder layout the neighbours come toward the viewer
 * and end up looming larger than the card in front — the one the visitor is
 * meant to look at became the smallest thing on screen. Keeping part of the
 * depth preserves the turned-in bend while leaving the centre card dominant.
 */
const DEPTH = 0.45;


/**
 * How long the carousel rests on a card before turning by itself. Long enough
 * to watch the invitation move past its cover, short enough that a visitor who
 * never touches it still sees every theme within half a minute.
 */
const DWELL_MS = 9000;

/** Pause before the centre card starts scrolling, so the cover is seen first. */
const SCROLL_DELAY_S = 1.1;

/** How far the centre card scrolls, in card heights. */
const SCROLL_SCREENS = 2.2;

const FLICK_VELOCITY = 400;
const MAX_FLICK_CARDS = 2;
const DRAG_ELASTIC = 0.85;
const SETTLE_SPRING = { type: "spring", stiffness: 170, damping: 26 } as const;
const INTRO_TRANSITION = {
  duration: 2.2,
  delay: 0.2,
  ease: [0.45, 0, 0.65, 0.3],
} as const;

export function HeroCurvedCarousel({
  onActiveThemeChange,
}: {
  onActiveThemeChange?: (themeIndex: number) => void;
} = {}) {
  const t = useTranslations("HeroCarousel");
  const reduceMotion = useReducedMotion() ?? false;
  const cardAlts = t.raw("cards") as { alt: string }[];

  const [phase, setPhase] = useState<"intro" | "idle">("intro");
  const [position, setPosition] = useState(REFERENCE_INDEX);
  const activeCardId = ((position % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;

  useEffect(() => {
    onActiveThemeChange?.(activeCardId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCardId]);

  // ── Geometry ───────────────────────────────────────────────────────────
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{
    cardW: number;
    cardH: number;
    vw: number;
  } | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const measure = () => {
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      // The rest of the box is kept for the reflection. A phone gets a
      // shorter box filled further, or the reflection zone below the cards
      // read as a blank gap before the call to action.
      const fill = vw < MOBILE_BREAKPOINT ? 0.8 : 0.7;
      const maxH = (vh * fill) / (1 + ACTIVE_BOOST);
      const maxW = (vw * (vw < MOBILE_BREAKPOINT ? 0.66 : 0.3)) / (1 + ACTIVE_BOOST);
      let cardH = maxH;
      let cardW = cardH * CARD_RATIO;
      if (cardW > maxW) {
        cardW = maxW;
        cardH = cardW / CARD_RATIO;
      }
      setDims({ cardW, cardH, vw });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cardW = dims?.cardW ?? 0;
  const cardH = dims?.cardH ?? 0;
  const isMobile = (dims?.vw ?? 1024) < MOBILE_BREAKPOINT;
  const curveFactor = isMobile ? MOBILE_CURVE_FACTOR : 1;
  const step = cardW * (1 + CURVE_GAP);
  /*
   * The card at the screen edge must not turn past MAX_EDGE_ANGLE. A card is
   * sized by the box height, so a very wide screen fits more of them across,
   * and at a fixed 16° per card the ones at the edge of a 2560px display were
   * turned 80–96° — seen edge-on, then from behind. Wide screens get a
   * shallower curve; up to ~2000px it is exactly CURVE_ANGLE.
   */
  const edgeCards = step ? (dims?.vw ?? 0) / 2 / step : 1;
  const angle = Math.min(CURVE_ANGLE * curveFactor, MAX_EDGE_ANGLE / Math.max(edgeCards, 1));
  // Radius of the circle on which consecutive cards sit `step` apart.
  const radius = step / (2 * Math.sin(((angle / 2) * Math.PI) / 180));
  // Perspective scaled to the card, so the bend reads the same at any size.
  const perspective = cardW * 5.5;
  /*
   * Cards rendered either side of the active one: enough to reach both edges
   * of the screen, plus one spare that sits just outside it.
   *
   * This was a fixed 3 with the outermost pair faded out, which filled a
   * 1440px screen but left a bare strip down each side of a 1728px one. The
   * cards now run off the edges and are clipped there, as in a real reel —
   * and the spare means a card is always already in place beyond the edge
   * before a turn brings it into view.
   */
  const sideCount = step ? Math.ceil((dims?.vw ?? 0) / 2 / step) + 1 : 3;

  // ── Track ──────────────────────────────────────────────────────────────
  // `x` is the offset of card 0's centre from the viewport centre, exactly as
  // in `HeroCarousel`. Cards no longer ride a translated track — each derives
  // its own place on the arc from `x` — so the gesture is read with `onPan`
  // rather than by dragging an element.
  const x = useMotionValue(0);
  const restX = -position * step;
  const draggingRef = useRef(false);
  const panStartRef = useRef(0);
  const movedRef = useRef(false);
  const placedRef = useRef(false);

  useEffect(() => {
    if (!step || phase !== "intro" || placedRef.current) return;
    placedRef.current = true;
    x.set(-(REFERENCE_INDEX - INTRO_OVERSHOOT) * step);
    animate(x, -REFERENCE_INDEX * step, reduceMotion ? { duration: 0 } : INTRO_TRANSITION).then(
      () => setPhase("idle"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, phase]);

  useEffect(() => {
    if (!step || phase !== "idle" || draggingRef.current) return;
    animate(x, restX, SETTLE_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restX, step, phase]);

  // ── Auto-advance ───────────────────────────────────────────────────────
  const [hovered, setHovered] = useState(false);
  const [interacted, setInteracted] = useState(false);
  // Explicit, from the pause button. Unlike `interacted`, it also freezes the
  // centre card's scroll, and it can be undone.
  const [paused, setPaused] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    const onVis = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const autoplay =
    phase === "idle" &&
    !reduceMotion &&
    !paused &&
    !hovered &&
    !focusWithin &&
    !interacted &&
    onScreen &&
    pageVisible;

  useEffect(() => {
    if (!autoplay) return;
    // Re-armed on every position change, so a manual turn always gets a full
    // dwell before the carousel moves on its own.
    const id = window.setTimeout(() => setPosition((p) => p + 1), DWELL_MS);
    return () => window.clearTimeout(id);
  }, [autoplay, position]);

  // ── Input ──────────────────────────────────────────────────────────────
  const goTo = (target: number) => {
    setInteracted(true);
    setPosition(target);
  };

  const handlePanStart = () => {
    if (phase !== "idle") return;
    draggingRef.current = true;
    movedRef.current = true;
    setInteracted(true);
    x.stop();
    panStartRef.current = x.get();
  };

  const handlePan = (_e: unknown, info: PanInfo) => {
    if (!draggingRef.current || !step) return;
    x.set(panStartRef.current + info.offset.x * DRAG_ELASTIC);
    const nearest = Math.round(-x.get() / step);
    setPosition((prev) => (prev === nearest ? prev : nearest));
  };

  const handlePanEnd = (_e: unknown, info: PanInfo) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (!step) return;

    const velocity = info.velocity.x;
    const current = -x.get() / step;
    const flickCards =
      Math.abs(velocity) > FLICK_VELOCITY
        ? Math.min(Math.round(Math.abs(velocity) / FLICK_VELOCITY), MAX_FLICK_CARDS) *
          -Math.sign(velocity)
        : 0;
    const target = Math.round(current) + flickCards;

    if (target === position) animate(x, restX, SETTLE_SPRING);
    else setPosition(target);

    // A pan ends with a pointerup, which the card beneath would read as a
    // click on the next frame. Cleared after it, so real taps still work.
    window.setTimeout(() => (movedRef.current = false), 0);
  };

  const activeTheme = THEMES[activeCardId];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (phase !== "idle") return;
    // Visual direction, not reading direction: the cards are not mirrored in
    // right-to-left locales, so → always brings in the card on the right.
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(position + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(position - 1);
    }
  };

  // Shared by the three controls. Drawn on the violet band, so the ring is
  // white with a violet gap rather than the browser's default blue.
  const controlFocus =
    "outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-studio-violet";

  return (
    <section
      aria-roledescription={t("roleDescription")}
      aria-label={t("regionLabel")}
      onKeyDown={handleKeyDown}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        // Moving focus between two controls of the carousel is not leaving it.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setFocusWithin(false);
        }
      }}
      className="relative flex w-full flex-col items-center"
    >
      {/* The name of the theme in front. Decorative duplicate of the live
          region below, so hidden from assistive tech. */}
      <div
        aria-hidden
        className="relative z-20 flex h-10 items-center gap-5 font-heading text-2xl text-white md:h-12 md:text-3xl"
      >
        <span className="font-light text-studio-jaune/70">{"{"}</span>
        <span className="relative inline-grid min-w-[9ch] place-items-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={activeTheme.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 28, filter: "blur(6px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -28, filter: "blur(6px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="whitespace-nowrap"
            >
              {activeTheme.name}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="font-light text-studio-jaune/70">{"}"}</span>
      </div>

      <p aria-live={autoplay ? "off" : "polite"} aria-atomic="true" className="sr-only">
        {t("activeThemeAnnouncement", { name: activeTheme.name })}
      </p>

      <button
        type="button"
        onClick={() => goTo(position - 1)}
        aria-label={t("prevAriaLabel")}
        className={cn(
          "absolute left-2 top-[45%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 disabled:opacity-0 md:left-8",
          controlFocus,
        )}
        disabled={phase !== "idle"}
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <motion.div
        ref={viewportRef}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
        className={cn(
          // `isolate` keeps the cards' z-indexes (up to 100, so they stack
          // among themselves) inside this box. Without it they competed with
          // the arrows' z-30 in the parent and painted over them, and the
          // arrows could not be clicked at all.
          "relative isolate mt-4 h-[490px] w-full overflow-hidden md:h-[700px]",
          "touch-pan-y",
          phase === "idle" && "select-none cursor-grab active:cursor-grabbing",
        )}
      >
        {dims &&
          Array.from({ length: sideCount * 2 + 1 }, (_, k) => {
            const trackIndex = position - sideCount + k;
            const cardId = ((trackIndex % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
            return (
              <CurvedCard
                key={trackIndex}
                trackIndex={trackIndex}
                x={x}
                step={step}
                angle={angle}
                radius={radius}
                perspective={perspective}
                cardW={cardW}
                cardH={cardH}
                image={THEMES[cardId].image}
                active={trackIndex === position}
                slideLabel={t("slideLabel", {
                  name: THEMES[cardId].name,
                  index: cardId + 1,
                  total: CARD_COUNT,
                })}
                slideRoleDescription={t("slideRoleDescription")}
                strip={`/themes/${THEMES[cardId].id}/scroll.webp`}
                alt={cardAlts[cardId]?.alt ?? ""}
                priority={trackIndex === REFERENCE_INDEX}
                // Scrolls only once the carousel is at rest on it: during the
                // intro and mid-drag the card is merely passing through.
                live={
                  phase === "idle" && trackIndex === position && !reduceMotion && !paused
                }
                onSelect={() => {
                  if (movedRef.current || phase !== "idle") return;
                  if (trackIndex !== position) goTo(trackIndex);
                }}
              />
            );
          })}
      </motion.div>

      <button
        type="button"
        onClick={() => goTo(position + 1)}
        aria-label={t("nextAriaLabel")}
        className={cn(
          "absolute right-2 top-[45%] z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-md transition-transform hover:scale-105 disabled:opacity-0 md:right-8",
          controlFocus,
        )}
        disabled={phase !== "idle"}
      >
        <ArrowRight className="h-5 w-5" />
      </button>

      {/* Nothing moves under reduced motion, so there is nothing to pause. */}
      {!reduceMotion && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? t("playAriaLabel") : t("pauseAriaLabel")}
          // The name flips with the state, so no aria-pressed as well — a
          // button announced as "Resume the carousel, pressed" contradicts
          // itself.
          className={cn(
            "relative z-30 -mt-2 flex h-11 w-11 items-center justify-center rounded-full border border-studio-violet/15 bg-white/80 text-studio-violet shadow-sm backdrop-blur transition-colors hover:bg-white",
            controlFocus,
            "focus-visible:ring-studio-violet focus-visible:ring-offset-studio-beurre",
          )}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      )}
    </section>
  );
}

function CurvedCard({
  trackIndex,
  x,
  step,
  angle,
  radius,
  perspective,
  cardW,
  cardH,
  image,
  active,
  slideLabel,
  slideRoleDescription,
  strip,
  alt,
  priority,
  live,
  onSelect,
}: {
  trackIndex: number;
  x: MotionValue<number>;
  step: number;
  angle: number;
  radius: number;
  perspective: number;
  cardW: number;
  cardH: number;
  image: string;
  active: boolean;
  slideLabel: string;
  slideRoleDescription: string;
  strip: string;
  alt: string;
  priority: boolean;
  live: boolean;
  onSelect: () => void;
}) {
  // Signed distance from the centre, in cards: 0 in front, ±1 for the
  // neighbours, fractional mid-gesture.
  const d = useTransform(x, (v) => (trackIndex * step + v) / step);

  // A point on the inside of a cylinder: pushed sideways by R·sin θ, brought
  // toward the viewer by R·(1 − cos θ), and turned by −θ so it faces the
  // axis. `perspective()` lives in each card's own transform rather than on a
  // shared 3D context: that way the cards are flattened one by one and
  // `zIndex` decides who is on top — in a preserve-3d context the turned-in
  // neighbours, being closer, would paint over the centre card.
  const transform = useTransform(d, (v) => {
    const theta = v * angle;
    const rad = (theta * Math.PI) / 180;
    const tx = radius * Math.sin(rad);
    const tz = radius * (1 - Math.cos(rad)) * DEPTH;
    const s = 1 + ACTIVE_BOOST * Math.max(0, 1 - Math.abs(v));
    return `perspective(${perspective}px) translate3d(${tx}px, 0, ${tz}px) rotateY(${-theta}deg) scale(${s})`;
  });
  const zIndex = useTransform(d, (v) => 100 - Math.round(Math.abs(v) * 10));

  return (
    <motion.div
      onClick={onSelect}
      // Only the card in front is exposed; its repeats either side are the
      // same three themes again and would be read out as more of them.
      role={active ? "group" : undefined}
      aria-roledescription={active ? slideRoleDescription : undefined}
      aria-label={active ? slideLabel : undefined}
      aria-hidden={active ? undefined : true}
      className="absolute left-1/2 top-[45%] overflow-hidden rounded-3xl md:top-[42%] bg-studio-beurre shadow-[0_24px_60px_-20px_rgba(46,32,84,0.45)]"
      style={{
        width: cardW,
        height: cardH,
        marginLeft: -cardW / 2,
        marginTop: -cardH / 2,
        transform,
        zIndex,
        // A faint reflection on the floor, as in a gallery vitrine. Chromium
        // and Safari only; elsewhere the card simply has no reflection.
        WebkitBoxReflect:
          "below 14px linear-gradient(transparent, transparent 58%, rgba(255,255,255,0.32))",
      }}
    >
      <Image
        src={image}
        alt={alt}
        fill
        sizes="(max-width: 640px) 66vw, 320px"
        className="object-cover object-top"
        priority={priority}
        draggable={false}
      />

      <AnimatePresence>
        {live && <ScrollingStrip key="strip" src={strip} cardW={cardW} cardH={cardH} />}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * The invitation, moving slowly past the card's window.
 *
 * Laid over the cover, which is its exact first screen, and faded in only once
 * loaded — so arriving on a card never shows a blank or a jump. On leaving, it
 * fades out over the cover rather than snapping back to the top.
 */
function ScrollingStrip({
  src,
  cardW,
  cardH,
}: {
  src: string;
  cardW: number;
  cardH: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const stripH = cardW / STRIP_RATIO;
  const travel = Math.min(stripH - cardH, cardH * SCROLL_SCREENS);
  // Paced to finish just before the carousel turns, with the delay in front.
  const duration = DWELL_MS / 1000 - SCROLL_DELAY_S - 0.6;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
      transition={{ duration: 0.25 }}
    >
      <motion.img
        src={src}
        alt=""
        draggable={false}
        onLoad={() => setLoaded(true)}
        className="absolute left-0 top-0 w-full max-w-none select-none"
        style={{ height: stripH }}
        initial={{ y: 0 }}
        animate={loaded ? { y: -travel } : { y: 0 }}
        transition={{ delay: SCROLL_DELAY_S, duration, ease: [0.45, 0.05, 0.35, 1] }}
      />
    </motion.div>
  );
}

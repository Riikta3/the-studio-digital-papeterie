"use client";

import { studioColors } from "@shared/lib/studio-colors";
import { cn } from "@shared/lib/utils";
import type { MotionValue } from "framer-motion";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Link2, Mail, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { FadeIn } from "./FadeIn";
import { THEMES } from "./themes";
import { UpcomingThemeCard } from "./UpcomingThemeCard";

// Card visuals (border gradient, shadow tint) come straight from the studio
// design tokens — Tailwind v3 has no CSS-variable escape hatch for gradient
// borders, so we read the resolved hex values here instead of duplicating them.
const CARD_BORDER_GRADIENT = `linear-gradient(${studioColors.cardBg}, ${studioColors.cardBg}), linear-gradient(180deg, ${studioColors.cardBorderStart} 0%, ${studioColors.cardBorderEnd} 100%)`;
const CARD_SHADOW = `0px 22px 53.9px 0px ${studioColors.cardShadow}3D`;
const MOCK_BORDER_STYLE = {
  backgroundImage: `linear-gradient(white, white), linear-gradient(180deg, ${studioColors.cardBorderEnd} 0%, ${studioColors.cardBorderStart} 100%)`,
  backgroundOrigin: "border-box" as const,
  backgroundClip: "padding-box, border-box" as const,
};

type Step = {
  number: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
};

/**
 * Step 01: the themes a couple actually picks from.
 *
 * This used to be four flat colour swatches, which showed nothing a customer
 * could choose — the step promises "a design that looks like you" and answered
 * with two rectangles of beige. It now renders the real theme covers, the same
 * artwork as the hero fan and the phone mockup.
 *
 * Like the two mocks below it, this is an illustration and not a control: the
 * selectable version of this lives in `Preview`, and making one card here
 * clickable would suggest the other three are too.
 */
function UniverseMock({
  label,
  upcomingTitle,
  upcomingSubtitle,
}: {
  label: string;
  upcomingTitle: string;
  upcomingSubtitle: string;
}) {
  return (
    <div
      style={MOCK_BORDER_STYLE}
      className="w-full max-w-sm rounded-2xl border border-transparent bg-white p-5 md:max-w-md lg:max-w-lg"
    >
      <p className="mb-4 text-center font-body text-h4 text-studio-violet/70">
        {label}
      </p>
      {/* Portrait covers, so one row of four rather than the 2×2 grid the
          landscape swatches needed. The closing card keeps the row even —
          three themes across four columns would leave a hole. */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {THEMES.map((theme, i) => (
          <div key={theme.id} className="text-center">
            <div
              className={cn(
                "relative aspect-[290/540] overflow-hidden rounded-xl",
                // One card reads as picked, the way the step describes.
                i === 0 && "ring-2 ring-studio-violet ring-offset-2",
              )}
            >
              <Image
                src={theme.image}
                alt={theme.name}
                fill
                sizes="(min-width: 1024px) 120px, 80px"
                className="object-cover"
              />
            </div>
            <p className="mt-2 truncate font-body text-[11px] text-studio-violet/70">
              {theme.name}
            </p>
          </div>
        ))}
        <div className="text-center">
          <div className="relative aspect-[290/540]">
            <UpcomingThemeCard
              compact
              title={upcomingTitle}
              subtitle={upcomingSubtitle}
            />
          </div>
          {/* Spacer, not a label: holds this card's artwork level with the
              themed ones, whose names sit on this line. */}
          <p aria-hidden="true" className="mt-2 font-body text-[11px]">
            &nbsp;
          </p>
        </div>
      </div>
    </div>
  );
}

function PersonalizeMock({
  label,
  rowLabels,
}: {
  label: string;
  rowLabels: string[];
}) {
  const rows = rowLabels.map((rowLabel, i) => ({
    label: rowLabel,
    on: i < 2,
  }));
  return (
    <div
      style={MOCK_BORDER_STYLE}
      className="w-full max-w-sm rounded-2xl border border-transparent bg-white p-5 md:max-w-md lg:max-w-lg"
    >
      <p className="mb-4 text-center font-body text-h4 text-studio-violet/70">
        {label}
      </p>
      <div className="flex flex-col divide-y divide-studio-beige">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3"
          >
            <span className="font-body text-h5 text-studio-violet/80">
              {row.label}
            </span>
            <span
              className={cn(
                "flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
                row.on ? "bg-studio-violet" : "bg-studio-beige",
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full bg-white shadow transition-transform",
                  row.on && "translate-x-5",
                )}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Lucide dropped brand icons, so this is a hand-rolled WhatsApp glyph
// drawn with the same stroke conventions (24px grid, 2px round strokes,
// currentColor) to sit seamlessly next to the other lucide icons.
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0-1 0" />
    </svg>
  );
}

function ShareMock({
  label,
  actionLabels,
}: {
  label: string;
  actionLabels: string[];
}) {
  const icons = [Link2, Mail, WhatsappIcon, Send];
  const actions = actionLabels.map((actionLabel, i) => ({
    label: actionLabel,
    icon: icons[i] ?? Link2,
  }));
  return (
    <div
      style={MOCK_BORDER_STYLE}
      className="w-full max-w-sm rounded-2xl border border-transparent bg-white p-5 md:max-w-md lg:max-w-lg"
    >
      <p className="mb-4 text-center font-body text-h4 text-studio-violet/70">
        {label}
      </p>
      <div className="flex flex-col divide-y divide-studio-beige">
        {actions.map(({ label: actionLabel, icon: Icon }) => (
          <div
            key={actionLabel}
            className="flex items-center justify-between py-3"
          >
            <span className="font-body text-h5 text-studio-violet/80">
              {actionLabel}
            </span>
            <Icon className="h-4 w-4 text-studio-violet/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stacking cards.
 *
 * Deliberately minimal, after several rewrites that failed by adding rules
 * instead of removing them. The mechanism is three ingredients and nothing
 * else:
 *
 *  1. The cards are `sticky` siblings sharing one container, all pinned at
 *     the same `top`. Same container is what lets them accumulate: a sticky
 *     element is confined to its containing block, so per-card wrappers
 *     release each card the instant its own wrapper scrolls past — the bug
 *     that made this section play as three cards filing past one another.
 *  2. Every card is the same height, and that height leaves room below the
 *     pin line. Both halves matter: equal heights keep the pile's edges
 *     clean, and a card sized to the full `100svh - top` would fill the
 *     screen with no room for the next one to climb into. The figures are two
 *     constants in CSS, not a JS measuring pass.
 *  3. Nothing follows the cards. An earlier version added a trailing spacer
 *     to lengthen the section; it only produced a screen of empty beurre to
 *     scroll through under the finished pile. The travel the pile needs is
 *     already there — the container is three card-heights tall while one card
 *     is on screen at a time.
 *
 * The depth cue is a vertical offset plus a veil, never `scale` (scaling
 * shrinks width too, so a buried card is narrower than the one landing on it
 * and their edges cannot line up) and never `opacity` (fading a card fades
 * its background, so the card underneath shows through).
 */

const STICKY_TOP_MOBILE = 16;
const STICKY_TOP_DESKTOP = 88;
// Per-card-behind depth cue for cards already in the pile.
const LIFT_STEP = 18;
const DIM_STEP = 0.16;
// One height for every card, so the pile has clean edges: a card shorter than
// the one behind it lets that card's bottom show below the stack, and a taller
// one overhangs it. Natural heights differ by ~25px here (measured 503/528/508
// at mobile width, 466/488/468 at desktop), which is exactly the sort of
// ragged edge that reads as a mistake in a stack.
//
// Two values because the cards are not the same shape at both widths — the
// titles wrap to two lines and the descriptions run longer on a phone — and
// each is capped against the viewport, because a sticky element taller than
// `100svh - top` cannot pin at all: it just scrolls past. `svh`, not `vh`: on
// a phone the URL bar makes `vh` describe a taller viewport than the visible
// one, and that difference is precisely the overhang that breaks the pin.
const CARD_HEIGHT_MOBILE = `min(540px, calc(100svh - ${STICKY_TOP_MOBILE}px - 16px))`;
const CARD_HEIGHT_DESKTOP = `min(500px, calc(100svh - ${STICKY_TOP_DESKTOP}px - 24px))`;

function StackCard({
  step,
  content,
  index,
  total,
  progress,
  reduceMotion,
}: {
  step: Step;
  content: React.ReactNode;
  index: number;
  total: number;
  progress: MotionValue<number>;
  reduceMotion: boolean;
}) {
  // `progress` runs 0 → 1 across the pile, one step per card. A card holds
  // still until it lands, then recedes as the others stack onto it. The last
  // card has nothing behind it, so it never offsets — it is the top of the
  // pile, and its motion is the scroll carrying it into place.
  const cardsBehind = total - 1 - index;
  const land = index / (total - 1 || 1);

  const y = useTransform(progress, [land, 1], [0, -LIFT_STEP * cardsBehind]);
  const veilOpacity = useTransform(
    progress,
    [land, 1],
    [0, Math.min(1, DIM_STEP * cardsBehind)],
  );

  return (
    <motion.div
      style={{
        top: "var(--stack-top)",
        y: reduceMotion ? 0 : y,
        backgroundImage: CARD_BORDER_GRADIENT,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: CARD_SHADOW,
        height: "var(--stack-card-height)",
      }}
      className="sticky mx-auto flex w-full max-w-[370px] flex-col items-start gap-4 overflow-hidden rounded-2xl border border-transparent px-4 pb-6 pt-8 text-left md:max-w-2xl md:px-8 lg:max-w-4xl"
    >
      {/* The veil sits inside the card's own clipped, rounded box so it
          follows the corners, and is inert so a buried card's contents never
          intercept clicks. */}
      {!reduceMotion && (
        <motion.div
          aria-hidden
          style={{ opacity: veilOpacity }}
          className="pointer-events-none absolute inset-0 z-10 bg-studio-beurre"
        />
      )}
      <div className="flex items-end gap-4">
        <span className="font-heading text-7xl leading-none text-studio-violet md:text-8xl">
          {step.number}
        </span>
        <h3 className="font-heading text-h2 text-studio-violet">
          <span className="block">{step.titleLine1}</span>
          {step.titleLine2 && <span className="block">{step.titleLine2}</span>}
        </h3>
      </div>
      <p className="font-body text-sm text-studio-violet/70 md:text-base">
        {step.description}
      </p>
      <div className="flex w-full items-center justify-center pt-2">
        {content}
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);

  // Progress is measured off the container's own rect against `scrollY`
  // rather than with `useScroll({ target })`. That hook finds its scroll
  // container by walking up for a scrollable ancestor, and this layout has a
  // trap for it: `<body>` carries `overflow-x-hidden`, and CSS turns the other
  // axis of a single-axis `hidden` into `auto`, so body advertises
  // `overflow-y: auto` while never scrolling (its scrollTop stays 0 — the
  // document element is the real scroller). Framer Motion latched onto body
  // and left progress frozen at 0: the cards stacked via plain CSS sticky but
  // nothing ever moved or dimmed.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      const pinLine =
        parseFloat(
          getComputedStyle(container).getPropertyValue("--stack-top"),
        ) || 0;
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) {
        progress.set(0);
        return;
      }
      progress.set(Math.min(Math.max((pinLine - rect.top) / travel, 0), 1));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [progress]);

  const steps = t.raw("steps") as Step[];
  const personalizeMockRows = t.raw("personalizeMockRows") as string[];
  const shareMockActions = t.raw("shareMockActions") as string[];

  const mocks = [
    <UniverseMock
      key="universe"
      label={t("universeMockLabel")}
      upcomingTitle={t("upcomingTitle")}
      upcomingSubtitle={t("upcomingSubtitle")}
    />,
    <PersonalizeMock
      key="personalize"
      label={t("personalizeMockLabel")}
      rowLabels={personalizeMockRows}
    />,
    <ShareMock
      key="share"
      label={t("shareMockLabel")}
      actionLabels={shareMockActions}
    />,
  ];

  return (
    <section className="bg-studio-beurre px-6 pb-8 pt-20 md:px-12">
      <FadeIn className="mx-auto mb-16 max-w-3xl text-center">
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
      </FadeIn>

      {/* `--stack-top` is read by both the cards' CSS and the progress
          measurement above, so the pin line can never disagree between the
          two. A media query is the only way to vary it, since the cards set
          `top` inline (alongside the gradient border, which Tailwind cannot
          express) and inline styles beat utility classes. */}
      <style>{`
        [data-stack] {
          --stack-top: ${STICKY_TOP_MOBILE}px;
          --stack-card-height: ${CARD_HEIGHT_MOBILE};
        }
        @media (min-width: 768px) {
          [data-stack] {
            --stack-top: ${STICKY_TOP_DESKTOP}px;
            --stack-card-height: ${CARD_HEIGHT_DESKTOP};
          }
        }
      `}</style>

      <div ref={containerRef} data-stack className="relative">
        {steps.map((step, i) => (
          <StackCard
            key={step.number}
            step={step}
            content={mocks[i]}
            index={i}
            total={steps.length}
            progress={progress}
            reduceMotion={Boolean(reduceMotion)}
          />
        ))}
        {/* No trailing spacer. It used to supply the surplus height that keeps
            the earlier cards pinned, but it is dead space: you scroll through
            a screen of empty beurre under the finished pile. The scroll the
            pile needs comes from the cards' own stacked heights instead — the
            container is three card-heights tall while only one card is on
            screen at a time, so there is a card-height of travel per card
            with nothing left over. */}
      </div>
    </section>
  );
}

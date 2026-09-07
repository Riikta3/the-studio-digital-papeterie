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
            // `py-2.5`, not `py-3`. Every card shares one height, so the
            // tallest mock sets it for all three; at `py-3` these four rows
            // pushed that to 528px against the 511px the others needed, and
            // the surplus clipped the last row off the bottom.
            className="flex items-center justify-between py-2.5"
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
            // `py-2.5`, not `py-3`. Every card shares one height, so the
            // tallest mock sets it for all three; at `py-3` these four rows
            // pushed that to 528px against the 511px the others needed, and
            // the surplus clipped the last row off the bottom.
            className="flex items-center justify-between py-2.5"
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
 * Stacking cards, pinned together with their title as one block.
 *
 * The whole section — heading and all three cards — is a SINGLE sticky block.
 * The title therefore cannot drift relative to the pile: they pin together,
 * hold while the cards stack, and are released together, so the finished pile
 * scrolls away with its heading still attached.
 *
 * Two earlier architectures failed, and this one is shaped around both
 * failures:
 *
 *  - Sticky cards as siblings with the title in normal flow. The cards
 *    accumulated correctly, but the title scrolled off on its own as the
 *    animation began, which is what this rewrite exists to fix.
 *  - Sticky cards plus a SEPARATELY sticky title. Two stickies competed for
 *    the same vertical space: the title's band was subtracted from the height
 *    left to the cards, and on a screen too short for both, every fallback
 *    read worse than having no pinned title at all — a static title painted
 *    under the cards is visibly sliced in half as one crosses it.
 *
 * With one block there is no competition and no stacking order to get wrong:
 * the title is inside the pinned box, so no card can pass over or under it.
 *
 * The mechanism:
 *
 *  1. `[data-stack]` is the runway — a tall, plain element sized to the block
 *     plus a screen of travel per card after the first. Its height is the
 *     only thing giving the pile something to scroll through.
 *  2. `[data-stack-pin]` is the sticky block inside it, one viewport tall,
 *     holding the title above the card well.
 *  3. Inside the well the cards are ABSOLUTELY positioned on a shared origin.
 *     Absolute rather than sticky because the block is already pinned: a card
 *     no longer has to pin itself, it only has to arrive. Each starts
 *     translated below the well and slides to the origin across its own step.
 *
 * The depth cue for cards already in the pile is a vertical offset plus a
 * veil, never `scale` (scaling shrinks width too, so a buried card is
 * narrower than the one landing on it and their edges cannot line up) and
 * never `opacity` (fading a card fades its background, so the card underneath
 * shows through).
 */

// Per-card-behind depth cue for the cards already in the pile.
const LIFT_STEP = 18;
const DIM_STEP = 0.16;
// How far the deepest card ends up above the pile's origin: the top card sits
// at the origin, each card behind it is lifted one step further.
const MAX_LIFT = LIFT_STEP * 2;

// Card heights, driven by content and NOT capped against the viewport.
//
// The mocks are incompressible — measured, the tallest card's content needs
// 525px at mobile width and 488px at desktop — and every card shares one
// height so the pile keeps clean edges. Capping the height against the screen
// is a trap that bit twice: on a 723px viewport it produced a 515px card for
// 525px of content, silently clipping the last toggle row, and on a 667px
// phone it fell to 459px. Whatever gives on a short screen, it is not the
// illustration the step is explaining — it is the heading, which is why the
// title has a compact variant rather than the card having a cap.
const CARD_HEIGHT_MOBILE = 528;
const CARD_HEIGHT_DESKTOP = 492;

// How much of a screen of scrolling one card's arrival takes. Below 1 the
// next card starts before the previous has fully settled, which reads as a
// pile being dealt rather than three separate slides.
const SCROLL_PER_CARD = 0.9;

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
  // `progress` runs 0 → 1 across the pile, one step per card AFTER the first:
  // card 01 is already in place when the block pins, so it has no arrival.
  const steps = total - 1 || 1;
  const land = index / steps;
  const start = (index - 1) / steps;
  const cardsBehind = total - 1 - index;

  // Arrival and recede are ONE motion value, not two.
  //
  // `y` and `translateY` are aliases for the same transform channel in Framer,
  // so setting both writes only one of them — measured, a card given
  // `translateY: "108%"` and `y: 0` rendered `translateY(108%)` with the `y`
  // silently dropped. That is harmless only while the lift is 0; at the end of
  // the pile the two would collide and one of the movements would vanish. So
  // the arrival (a fraction of the card's own height) and the depth lift
  // (pixels) are composed here into a single `calc()`.
  const offset = useTransform(progress, (p) => {
    // Arrival: card 01 is already home when the block pins; the others slide
    // up from just below the well across their own step.
    const arriveSpan = land - Math.max(start, 0);
    const arrived =
      index === 0 || arriveSpan <= 0
        ? 1
        : Math.min(Math.max((p - Math.max(start, 0)) / arriveSpan, 0), 1);
    const enterPct = (1 - arrived) * 108;

    // Recede: once landed, sink one step per card that lands on top.
    const settleSpan = 1 - land;
    const settled =
      settleSpan <= 0
        ? 1
        : Math.min(Math.max((p - land) / settleSpan, 0), 1);
    const liftPx = -LIFT_STEP * cardsBehind * settled;

    return `calc(${enterPct}% + ${liftPx}px)`;
  });

  const veilOpacity = useTransform(
    progress,
    [land, 1],
    [0, Math.min(1, DIM_STEP * cardsBehind)],
  );

  return (
    <motion.div
      style={{
        // One vertical transform carrying both the arrival and the depth lift
        // — see `offset` above for why they cannot be two separate props.
        translateY: reduceMotion ? 0 : offset,
        backgroundImage: CARD_BORDER_GRADIENT,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: CARD_SHADOW,
        height: "var(--stack-card-height)",
        // Later cards paint over earlier ones, so the pile reads top-down.
        zIndex: index + 1,
      }}
      data-stack-card
      className="absolute inset-x-0 top-0 mx-auto flex w-full max-w-[370px] flex-col items-start gap-4 overflow-hidden rounded-2xl border border-transparent px-4 pb-6 pt-8 text-left md:max-w-2xl md:px-8 lg:max-w-4xl"
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
  const pinRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);

  // Progress is measured off the runway's own rect rather than with
  // `useScroll({ target })`. That hook finds its scroll container by walking
  // up for a scrollable ancestor, and this layout has a trap for it: a
  // single-axis `overflow: hidden` makes CSS compute the other axis as `auto`,
  // so body can advertise `overflow-y: auto` while never scrolling (its
  // scrollTop stays 0 — the document element is the real scroller). Framer
  // Motion latched onto body and left progress frozen at 0: the cards stacked
  // via plain CSS sticky but nothing ever moved or dimmed. That is also why
  // `shared/styles/globals.css` clips with `clip` and not `hidden`.
  useEffect(() => {
    const container = containerRef.current;
    const pin = pinRef.current;
    if (!container || !pin) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      // The block is pinned, so it is not part of the timeline: the travel is
      // the runway's height minus the block's.
      const travel = rect.height - pin.offsetHeight;
      if (travel <= 0) {
        progress.set(1);
        return;
      }
      // `-rect.top` is how far the runway's top has passed the viewport top,
      // which is exactly how long the block has been held.
      progress.set(Math.min(Math.max(-rect.top / travel, 0), 1));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // The heading's height moves with the font-size clamp, so the block's
    // height changes with the width — and a mobile URL bar collapsing changes
    // it without firing `resize`.
    const observer = new ResizeObserver(update);
    observer.observe(pin);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer.disconnect();
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

  // The block (one screen) plus a screen of travel per arriving card.
  const runway = `calc(100svh + ${(steps.length - 1) * SCROLL_PER_CARD * 100}svh)`;

  return (
    <section className="bg-studio-beurre px-6 pb-8 pt-20 md:px-12">
      {/* The card height is read by the cards' inline styles, which have to be
          inline anyway (the gradient border is not expressible in Tailwind)
          and inline styles beat utility classes — so a media query on a custom
          property is the only way to vary it per breakpoint.

          The heading's compact variant is a media query too, but on HEIGHT
          rather than width. Measured, the full heading needs 175px (134.6px of
          text plus its 40px margin at 606px wide); with a 528px card and the
          36px deepest lift that is 739px of block against a 723px screen, and
          a 667px phone falls short by 72px. Rather than cap the card — which
          silently clips the very mock the step is explaining — the heading
          drops its eyebrow and one size step, taking the band to ~69px and
          fitting the whole block inside 645px. */}
      <style>{`
        [data-stack] {
          --stack-card-height: ${CARD_HEIGHT_MOBILE}px;
        }
        @media (min-width: 768px) {
          [data-stack] {
            --stack-card-height: ${CARD_HEIGHT_DESKTOP}px;
          }
        }
        @media (max-height: 780px) {
          [data-stack-eyebrow] { display: none; }
          [data-stack-title] h2 { font-size: 1.875rem; line-height: 1.15; margin-top: 0; }
          [data-stack-title] { margin-bottom: 0.75rem; }
        }
        /* Under 645px even the compact heading cannot pay for the block: the
           deficit is 25px at 620px, and only the card could cover it. Clipping
           the mock is the mistake this rewrite exists to avoid, so the block
           keeps its full height and the heading shrinks as far as it usefully
           can. The block then slightly exceeds the screen and the title's top
           may sit just above it — the cards still stack against a fixed
           heading and the whole thing still scrolls as one piece.

           Every phone in real use clears the 645px floor (a 375×667 iPhone SE
           is the shortest common viewport), so this is a guard for desktop
           windows dragged very short, not a mobile path. */
        @media (max-height: 644px) {
          [data-stack-title] h2 { font-size: 1.5rem; }
          [data-stack-title] { margin-bottom: 0.5rem; }
        }
      `}</style>

      {/* The runway. Plain and tall: it exists only to give the pinned block
          something to be held against. */}
      <div
        ref={containerRef}
        data-stack
        className="relative"
        style={{ height: runway }}
      >
        {/* The pinned block: heading and cards together, one viewport tall so
            it fills the screen while held, and centring its own contents —
            there is no separate pin line to keep in sync any more. */}
        <div
          ref={pinRef}
          data-stack-pin
          className="sticky top-0 flex h-[100svh] flex-col justify-center"
        >
          <div data-stack-title className="mb-6 shrink-0 text-center">
            <div className="mx-auto max-w-3xl">
              <div
                data-stack-eyebrow
                className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre"
              >
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
            </div>
          </div>

          {/* The card well: one card tall plus the deepest lift, so a receded
              card's top edge stays inside the block rather than being cut off.
              The cards within are absolute and share this box's origin. */}
          <div
            className="relative mx-auto w-full shrink-0"
            style={{
              height: `calc(var(--stack-card-height) + ${MAX_LIFT}px)`,
              paddingTop: `${MAX_LIFT}px`,
            }}
          >
            <div className="relative h-full w-full">
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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

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
            // `py-2.5`, not `py-3`: with four rows the extra 4px per row made
            // step 02's card want 528px against the 511px the other two need,
            // and since every card shares one height that surplus is what
            // clipped the last toggle off the bottom of the mock.
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
            // `py-2.5`, not `py-3`: with four rows the extra 4px per row made
            // step 02's card want 528px against the 511px the other two need,
            // and since every card shares one height that surplus is what
            // clipped the last toggle off the bottom of the mock.
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

// Per-card-behind depth cue for cards already in the pile.
const LIFT_STEP = 18;
const DIM_STEP = 0.16;
// How far the deepest card in the pile ends up above the pin line: the top
// card sits at the line, and each card behind it is lifted one step further.
const MAX_LIFT = LIFT_STEP * 2;

// Where the pile pins.
//
// This is derived from the viewport rather than being a fixed offset, so the
// pile lands centred. The pinned card sits AT this line and the buried ones
// sit above it, so a small `top` pushes their edges off the top of the screen
// — measured with `top: 16px` and a 36px deepest lift, the first card's edge
// ended up at -20px, out of sight, while 167px of empty beurre sat below the
// pile. That is the "on ne voit pas le dessus" symptom.
//
// So: centre the whole pile (a card plus the lift stack above it) in the
// space left below the sticky title, then push down by MAX_LIFT so the line
// refers to the pinned card while the lifted edges stay on screen.
//
// BIAS lifts the pile slightly above dead centre, which leaves a little more
// air under the bottom card than above the pile. Exact centring left the two
// margins identical (measured 73.5px each at a 723px viewport) and the pile
// read as sitting low, with the card's bottom edge close to the fold.
const CENTRE_BIAS = 22;
// The vertical band the pinned title occupies: its own height (measured 135px
// on mobile, larger on desktop where the heading is bigger) plus a little air
// before the pile. Kept tight — over-reserving here comes straight out of the
// cards' height budget, and at 176px it starved them to 479px for ~538px of
// content, which clipped every mock.
// These have to be at least the title's real rendered height, since the pin
// floor is derived from them: under-reserving lets the lifted card edges climb
// behind the opaque band and clip the step's heading (measured, a 136px
// reservation against a 143px title put the deepest edge 7px too high).
const TITLE_BAND_MOBILE = 148;
const TITLE_BAND_DESKTOP = 180;
// The title stays pinned above the pile for the whole section, so every
// measurement below works from the space under it, not from the raw viewport.
// `max(...)` is a floor, and it is the rule that keeps the cards out from
// behind the title. The lift pulls a buried card ABOVE its pin line, so the
// clearance that matters is `pin - MAX_LIFT`, not `pin`: at a pin of 163.5px
// with a 36px lift the deepest card's edge reached 127.5px, under a 151px
// title band, and slid behind the opaque bar — clipping "03 Partagez" right
// off the card. The floor guarantees `pin - MAX_LIFT >= titleAllowance`.
const stickyTop = (titleAllowance: number) =>
  `max(${titleAllowance + MAX_LIFT}px, calc(${titleAllowance}px + (100svh - ${titleAllowance}px - var(--stack-card-height) - ${MAX_LIFT}px) / 2 + ${MAX_LIFT}px - ${CENTRE_BIAS}px))`;
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
// The cap leaves room for the lifted edges above the pinned card and a
// margin below, since a card taller than the space around the pin line
// cannot pin at all — it just scrolls past.
// The subtraction covers the pinned title band plus the lifted edges above
// the pinned card and a margin below it.
// Content-driven (the cards need ~538px at mobile width, ~488px at desktop),
// but capped so the pinned card still fits between the title band and the
// bottom of the screen. Both halves are needed: without the cap a 540px card
// under a 151px title overflowed a 723px viewport by 5px, and with the cap
// set too tight the mock inside gets clipped instead. The `max()` floor keeps
// the content readable if a viewport is short enough that neither fits — the
// pile just scrolls a little rather than hiding the illustration.
const cardHeight = (ideal: number, titleAllowance: number) =>
  `max(${Math.round(ideal * 0.82)}px, min(${ideal}px, calc(100svh - ${titleAllowance + MAX_LIFT}px - 24px)))`;
const CARD_HEIGHT_MOBILE = cardHeight(540, TITLE_BAND_MOBILE);
const CARD_HEIGHT_DESKTOP = cardHeight(500, TITLE_BAND_DESKTOP);

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
      data-stack-card
      className="sticky z-10 mx-auto flex w-full max-w-[370px] flex-col items-start gap-4 overflow-hidden rounded-2xl border border-transparent px-4 pb-6 pt-8 text-left md:max-w-2xl md:px-8 lg:max-w-4xl"
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
      // Read the resolved `top` off a CARD, not off the container's custom
      // property and not off the container's first child. `--stack-top` is a
      // `calc(...)` expression that `getPropertyValue` hands back unresolved
      // (parsing it yields NaN, collapsing the pin line to 0), and the first
      // child is now the sticky title, whose `top` is 0 rather than the
      // cards' pin line.
      const card = container.querySelector("[data-stack-card]");
      const pinLine =
        card instanceof HTMLElement
          ? parseFloat(getComputedStyle(card).top) || 0
          : 0;
      // The hold at the end of the container is not part of the timeline: the
      // pile is already complete while it scrolls past, so counting it would
      // stretch the animation past the moment the last card lands.
      const hold =
        parseFloat(getComputedStyle(container).getPropertyValue("height")) &&
        container.lastElementChild instanceof HTMLElement
          ? container.lastElementChild.offsetHeight
          : 0;
      const travel = rect.height - hold - window.innerHeight;
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
      {/* `--stack-top` is read by both the cards' CSS and the progress
          measurement above, so the pin line can never disagree between the
          two. A media query is the only way to vary it, since the cards set
          `top` inline (alongside the gradient border, which Tailwind cannot
          express) and inline styles beat utility classes.

          `--stack-title-h` is the band the pinned title occupies: the cards
          pin below it and their height budget starts from what it leaves. */}
      <style>{`
        [data-stack] {
          --stack-hold: 80px;
          --stack-title-h: ${TITLE_BAND_MOBILE}px;
          --stack-card-height: ${CARD_HEIGHT_MOBILE};
          --stack-top: ${stickyTop(TITLE_BAND_MOBILE)};
        }
        @media (min-width: 768px) {
          [data-stack] {
            --stack-title-h: ${TITLE_BAND_DESKTOP}px;
            --stack-card-height: ${CARD_HEIGHT_DESKTOP};
            --stack-top: ${stickyTop(TITLE_BAND_DESKTOP)};
          }
        }
      `}</style>

      {/* The title lives INSIDE the stack container and is sticky, so it holds
          above the pile for the whole section instead of scrolling away as the
          first card arrives. Outside the container it could not: a sticky
          element is released when its own containing block scrolls past, and
          the title's block ended at the cards' first pixel.

          It is not in the `FadeIn` wrapper any more either — that wrapper is a
          transformed element, and a transform creates a containing block that
          a descendant sticky would pin against instead of the viewport. */}
      <div ref={containerRef} data-stack className="relative">
        {/* Opaque, and full-bleed via the negative inline margins that undo
            the section's padding. A transparent sticky title let the cards
            slide visibly *through* the words as the pile scrolled away —
            "Votre faire-part, simplement." overlapping the share rows. The
            beurre background is the section's own, so the band is invisible
            until something passes behind it. */}
        {/* A plain div, NOT `FadeIn`. Two reasons, both observed here:
            - `FadeIn` sets `transform: translateY(32px)` in its hidden state,
              and a transform creates a containing block that a descendant
              sticky pins against instead of the viewport.
            - Its reveal is driven by an IntersectionObserver, which flipped
              the title back to the hidden state once the pinned band left the
              observed area. The title then faded to `opacity: 0.09` while
              still on screen, and the cards showed straight through the
              words as the pile scrolled away.
            The title is visible the moment the section is, so there is
            nothing for a reveal to add. */}
        <div
          // BELOW the cards in stacking order (`z-0` against their `z-10`),
          // which is what stops the exit looking broken. The title's pinned
          // life outlasts the cards' — sticky is released with its containing
          // block, and the cards' travel ends before the container does — so
          // on the way out they scroll up across the title's band. Painted
          // over it that reads as the pile leaving; painted under it, the
          // opaque band clipped each step's heading (measured: cards at
          // -177px while the title still held at 0).
          //
          // The band still hides the cards while they are BELOW it, because
          // the pinned card never rises above the title: see the `max()`
          // floor in `stickyTop`.
          className="sticky z-0 -mx-6 mb-6 bg-studio-beurre px-6 pb-2 text-center md:-mx-12 md:px-12"
          style={{ top: 0 }}
        >
          <div className="mx-auto max-w-3xl">
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
          </div>
        </div>

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
        {/* A short hold at the end, and only that.
            
            A sticky element is released the moment its containing block's
            bottom reaches it, and the container ends exactly where the last
            card ends — so card 03 arrived at its pin line and immediately
            started moving again, which is the small residual scroll the pile
            still showed once everything else was fixed (measured: zero pinned
            travel for the last card).
            
            Deliberately small — 80px, not a fraction of the viewport. Earlier
            attempts used 34svh and then a whole screen, and both read as an
            empty stretch of beurre you scroll through under the finished
            pile. This is just enough to stop the last card twitching. */}
        <div aria-hidden style={{ height: "var(--stack-hold)" }} />
      </div>
    </section>
  );
}

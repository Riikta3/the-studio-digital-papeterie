"use client";

import { studioColors } from "@shared/lib/studio-colors";
import { cn } from "@shared/lib/utils";
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

// Shared sticky anchor for every card in the stack.
const STICKY_TOP = 96;

// The card itself is the sticky element (no wrapper) — matches the
// reference stacking-cards implementation. Later cards sit later in the
// DOM, so they naturally paint over earlier ones without any z-index.
// All cards share the same sticky top so each one covers the previous
// exactly and the final pile is perfectly aligned when the section exits.
function StackCard({
  step,
  content,
}: {
  step: Step;
  content: React.ReactNode;
}) {
  return (
    <div
      style={{
        top: STICKY_TOP,
        backgroundImage: CARD_BORDER_GRADIENT,
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: CARD_SHADOW,
        transformOrigin: "top center",
      }}
      className="stack-card sticky mx-auto mb-8 flex min-h-[560px] w-full max-w-[370px] flex-col items-start gap-4 rounded-2xl border border-transparent px-4 pt-8 pb-4 text-left last:mb-0 md:max-w-2xl md:px-8 lg:max-w-4xl"
    >
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
      <div className="flex w-full flex-1 items-center justify-center">
        {content}
      </div>
    </div>
  );
}

// Ported from the reference stacking-cards main.js: one shared scroll
// listener shrinks each card slightly as it nears the viewport top.
//
// It also locks every card to the tallest card's height. Sticky release
// order at the end of the section depends on card heights: with unequal
// heights, card bottoms pin to the container bottom as the stack unpins,
// so a taller first card pokes out above the last one. Equal heights keep
// the stack perfectly aligned while it scrolls away.
function useStackCards(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>(".stack-card"),
    );

    const syncHeights = () => {
      cards.forEach((card) => {
        card.style.height = "auto";
      });
      const tallest = Math.max(...cards.map((card) => card.offsetHeight));
      cards.forEach((card) => {
        card.style.height = `${tallest}px`;
      });
    };

    const updateScale = () => {
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const progress = Math.min(Math.max((120 - rect.top) / 300, 0), 1);
        const scale = 1 - progress * 0.035;
        card.style.transform = `scale(${scale.toFixed(3)})`;
      });
    };

    syncHeights();
    updateScale();
    // Fonts loading in can change card heights after first paint.
    document.fonts?.ready.then(syncHeights);
    window.addEventListener("resize", syncHeights);
    window.addEventListener("scroll", updateScale, { passive: true });
    return () => {
      window.removeEventListener("resize", syncHeights);
      window.removeEventListener("scroll", updateScale);
    };
  }, [containerRef]);
}

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const containerRef = useRef<HTMLDivElement>(null);
  useStackCards(containerRef);

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
    <section className="bg-studio-beurre px-6 pt-20 md:px-12">
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

      <div ref={containerRef}>
        {steps.map((step, i) => (
          <StackCard key={step.number} step={step} content={mocks[i]} />
        ))}
        {/* Scroll runway for the last card. A sticky element can only stay
            pinned while its containing block still has scrollable height
            below it, and the last card's `last:mb-0` ends the container on
            its own bottom edge — so card 03 reached its sticky top and was
            immediately released, sliding over card 02 instead of stacking
            onto it. This spacer gives the pile somewhere left to scroll,
            which is what holds every card pinned at STICKY_TOP until the
            whole section leaves the viewport. */}
        <div aria-hidden className="h-[60vh]" />
      </div>
    </section>
  );
}

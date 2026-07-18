"use client";

import { studioColors } from "@shared/lib/studio-colors";
import { cn } from "@shared/lib/utils";
import { Link2, Mail, Send } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";

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
  title: string[];
  description: string;
  content: React.ReactNode;
};

function UniverseMock() {
  const swatches = [
    "bg-studio-pourpre",
    "bg-studio-beige",
    "bg-studio-jaune",
    "bg-studio-violet",
  ];
  return (
    <div
      style={MOCK_BORDER_STYLE}
      className="w-full max-w-sm rounded-2xl border border-transparent bg-white p-5 md:max-w-md lg:max-w-lg"
    >
      <p className="mb-4 text-center font-body text-h4 text-studio-violet/70">
        Sélectionner un univers
      </p>
      <div className="grid grid-cols-2 gap-3">
        {swatches.map((swatch, i) => (
          <div
            key={i}
            className={cn(
              "flex aspect-[7/3] items-center justify-center rounded-xl",
              swatch,
              i === 2 && "ring-2 ring-studio-violet ring-offset-2",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function PersonalizeMock() {
  const rows = [
    { label: "Livre d'or", on: true },
    { label: "Planning", on: true },
    { label: "Menu", on: false },
  ];
  return (
    <div
      style={MOCK_BORDER_STYLE}
      className="w-full max-w-sm rounded-2xl border border-transparent bg-white p-5 md:max-w-md lg:max-w-lg"
    >
      <p className="mb-4 text-center font-body text-h4 text-studio-violet/70">
        Personnalisez votre invitation
      </p>
      <div className="flex flex-col divide-y divide-studio-beige">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3"
          >
            <span className="font-body text-h5 text-studio-violet/80">{row.label}</span>
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

function ShareMock() {
  const actions = [
    { label: "Copier le lien", icon: Link2 },
    { label: "Envoyer par mail", icon: Mail },
    { label: "Envoyer par Whatsapp", icon: WhatsappIcon },
    { label: "Envoyer par SMS", icon: Send },
  ];
  return (
    <div
      style={MOCK_BORDER_STYLE}
      className="w-full max-w-sm rounded-2xl border border-transparent bg-white p-5 md:max-w-md lg:max-w-lg"
    >
      <p className="mb-4 text-center font-body text-h4 text-studio-violet/70">
        Partager votre invitation
      </p>
      <div className="flex flex-col divide-y divide-studio-beige">
        {actions.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between py-3"
          >
            <span className="font-body text-h5 text-studio-violet/80">{label}</span>
            <Icon className="h-4 w-4 text-studio-violet/60" />
          </div>
        ))}
      </div>
    </div>
  );
}

const STEPS: Step[] = [
  {
    number: "01",
    title: ["Choisissez", "votre univers"],
    description:
      "Sélectionnez un design qui vous ressemble. Minimaliste, romantique, audacieux, chaque univers est pensé pour raconter votre histoire.",
    content: <UniverseMock />,
  },
  {
    number: "02",
    title: ["Personnalisez", "votre invitation"],
    description:
      "Ajoutez vos photos, vos textes et les informations essentielles, RSVP, programme, hébergements… tout se personnalise en quelques clics.",
    content: <PersonalizeMock />,
  },
  {
    number: "03",
    title: ["Annoncez", "le grand jour"],
    description:
      "Envoyez votre invitation par SMS, Whatsapp ou e-mail. Vos invités répondent en quelques secondes, où qu'ils soient.",
    content: <ShareMock />,
  },
];

// Shared sticky anchor for every card in the stack.
const STICKY_TOP = 96;

// The card itself is the sticky element (no wrapper) — matches the
// reference stacking-cards implementation. Later cards sit later in the
// DOM, so they naturally paint over earlier ones without any z-index.
// All cards share the same sticky top so each one covers the previous
// exactly and the final pile is perfectly aligned when the section exits.
function StackCard({ step }: { step: Step }) {
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
          {step.title.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h3>
      </div>
      <p className="font-body text-sm text-studio-violet/70 md:text-base">
        {step.description}
      </p>
      <div className="flex w-full flex-1 items-center justify-center">
        {step.content}
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
      // The last card can only reach its pinned spot if the page keeps
      // scrolling past it. With little content below the section, tall
      // viewports run out of scroll before the pile completes, leaving
      // the last card hanging below the others. Reserve exactly the
      // missing room under the stack (48px of comfort margin).
      const needed = window.innerHeight - (STICKY_TOP + tallest) + 48;
      container.style.paddingBottom = `${Math.max(128, needed)}px`;
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
  const containerRef = useRef<HTMLDivElement>(null);
  useStackCards(containerRef);

  return (
    <section className="bg-studio-beurre px-6 pt-20 md:px-12">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>Simple, rapide et 100% personnalisé</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          Votre faire-part
          <br />
          <span className="text-studio-lavande">en 3 étapes</span>
        </h2>
      </div>

      <div ref={containerRef} className="pb-32">
        {STEPS.map((step) => (
          <StackCard key={step.number} step={step} />
        ))}
      </div>
    </section>
  );
}

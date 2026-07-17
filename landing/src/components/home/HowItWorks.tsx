"use client";

import { studioColors } from "@shared/lib/studio-colors";
import { cn } from "@shared/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link2, Mail, MessageCircle, Send } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

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
              "flex aspect-[4/3] items-center justify-center rounded-xl",
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

function ShareMock() {
  const actions = [
    { label: "Copier le lien", icon: Link2 },
    { label: "Envoyer par mail", icon: Mail },
    { label: "Envoyer par Whatsapp", icon: MessageCircle },
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

function StackCard({ step, index }: { step: Step; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const topOffset = 96 + index * 48;

  return (
    <div ref={cardRef} className="sticky" style={{ top: topOffset }}>
      <motion.div
        style={{
          scale,
          backgroundImage: CARD_BORDER_GRADIENT,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: CARD_SHADOW,
        }}
        className="mx-auto flex min-h-[560px] w-full max-w-[370px] flex-col items-start gap-4 rounded-2xl border border-transparent px-4 pt-8 pb-4 text-left md:max-w-2xl md:px-8 lg:max-w-4xl"
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
        <p className="font-body text-body-p text-studio-violet/70">
          {step.description}
        </p>
        <div className="flex w-full flex-1 items-center justify-center">
          {step.content}
        </div>
      </motion.div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="bg-studio-beurre px-6 pb-32 pt-20 md:px-12">
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

      <div className="flex flex-col gap-8">
        {STEPS.map((step, index) => (
          <StackCard key={step.number} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";

import { FadeIn } from "./FadeIn";

const TESTIMONIALS = [
  {
    quote:
      "Nos invités ont été bluffés par l'animation de l'enveloppe ! C'est le détail qui a tout changé. Les RSVP nous a sauvé un temps précieux.",
    names: "Juliette & Pierre",
    date: "Mariés en Septembre 2024",
  },
  {
    quote:
      "L'ambiance était magique, avec des lumières scintillantes et une musique envoûtante. Chaque moment a été immortalisé.",
    names: "Sophie & Antoine",
    date: "Mariés en Juin 2023",
  },
  {
    quote:
      "Nous avons découvert des paysages époustouflants lors de notre lune de miel. Les souvenirs de ces aventures resteront gravés.",
    names: "Emma & Lucas",
    date: "Mariés en Mai 2022",
  },
];

// Loop the row so the marquee has no visible seam.
const MARQUEE_ITEMS = [...TESTIMONIALS, ...TESTIMONIALS];

function TestimonialCard({
  quote,
  names,
  date,
}: {
  quote: string;
  names: string;
  date: string;
}) {
  return (
    <div className="relative w-full max-w-md shrink-0 rounded-2xl bg-white p-8 text-center shadow-sm">
      <span className="absolute left-3 top-0 font-heading text-8xl leading-none text-studio-lavande">
        &ldquo;
      </span>
      <span className="absolute bottom-0 right-3 font-heading text-8xl leading-none text-studio-lavande">
        &rdquo;
      </span>
      <p className="font-body text-sm text-studio-violet/80 md:text-base">
        {quote}
      </p>
      <div className="mt-4 flex justify-center gap-1 text-studio-jaune">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
      <p className="mt-3 font-heading text-lg text-studio-violet">{names}</p>
      <p className="font-body text-h5 text-studio-violet/50">{date}</p>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-studio-beurre px-6 py-20 md:px-12">
      <Image
        src="/images/leaf-top-lavande.svg"
        alt=""
        width={82}
        height={138}
        className="pointer-events-none absolute right-0 top-6 h-auto w-20 md:w-28"
      />

      <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>Ils nous ont fait confiance</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          Ce qu'ils en pensent
        </h2>
      </FadeIn>

      {/* Vertical marquee, top/bottom edges faded via mask-image. */}
      <FadeIn
        amount={0.2}
        className="relative mx-auto h-[560px] max-w-md overflow-hidden md:h-[640px]"
        style={{
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 10%, black 90%, transparent 100%)",
        }}
      >
        <div className="flex h-max animate-marquee flex-col gap-5">
          {MARQUEE_ITEMS.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

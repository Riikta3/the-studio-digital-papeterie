"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { FadeIn } from "./FadeIn";

type Testimonial = {
  quote: string;
  names: string;
  date: string;
};

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
  const t = useTranslations("Testimonials");
  const testimonials = t.raw("items") as Testimonial[];
  // Loop the row so the marquee has no visible seam.
  const marqueeItems = [...testimonials, ...testimonials];

  return (
    <section id="temoignages" className="relative overflow-hidden bg-studio-beurre px-6 py-20 md:px-12">
      <Image
        src="/images/leaf-top-lavande.svg"
        alt=""
        width={82}
        height={138}
        className="pointer-events-none absolute right-0 top-6 h-auto w-20 rotate-90 -scale-x-100 md:w-28"
      />

      <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
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
          {t("title")}
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
          {marqueeItems.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

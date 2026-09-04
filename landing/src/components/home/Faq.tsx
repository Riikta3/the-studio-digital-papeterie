"use client";

import { cn } from "@shared/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { FadeIn } from "./FadeIn";

type FaqItem = {
  question: string;
  answer: string;
};

export function Faq() {
  const t = useTranslations("Faq");
  const faqs = t.raw("items") as FaqItem[];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative overflow-hidden bg-studio-creme px-6 py-20 md:px-12">
      <Image
        src="/images/leaf-bottom-lavande.svg"
        alt=""
        width={106}
        height={188}
        className="pointer-events-none absolute -bottom-6 left-0 h-auto w-24 rotate-90 md:w-32"
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
          {t("titleLine1")}
          <br />
          <span className="text-studio-lavande">{t("titleAccent")}</span>
        </h2>
      </FadeIn>

      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <FadeIn key={faq.question} delay={index * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-studio-lavande/40 bg-white">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="font-heading text-lg text-studio-violet md:text-xl">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-studio-lavande text-studio-violet transition-colors",
                        isOpen && "bg-studio-lavande text-studio-violet",
                      )}
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                </h3>

                {/* Height animated with grid-template-rows rather than
                    framer-motion's `height: auto`: it interpolates to the
                    content's natural height in pure CSS, and animating
                    `height` on six panels was a non-composited animation
                    Lighthouse flagged. */}
                {/* Animated with max-height + opacity rather than
                    framer-motion's `height: auto`. `grid-template-rows:
                    1fr/0fr` was tried first and does not work here: the row
                    stayed collapsed at 0px because this container has no
                    height of its own to distribute. A generous max-height cap
                    is the reliable option — the transition is CSS-only, so
                    framer-motion is no longer needed for the accordion. */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? "40rem" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p className="px-6 pb-6 pt-0 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

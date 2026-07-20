"use client";

import { Leaf, Palette, Send, Smartphone, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { FadeIn } from "./FadeIn";

const REASON_ICONS = [Palette, Send, Smartphone, Leaf, Zap];

type Reason = {
  titleLine1: string;
  titleLine2: string;
  description: string;
};

export function WhyUs() {
  const t = useTranslations("WhyUs");
  const reasons = t.raw("reasons") as Reason[];

  return (
    <section id="fonctionnalites" className="relative overflow-hidden bg-studio-creme px-6 py-20 md:px-12">
      <Image
        src="/images/leaf-top-lavande.svg"
        alt=""
        width={94}
        height={138}
        className="pointer-events-none absolute right-0 top-[26rem] h-auto w-24 -scale-x-100 rotate-[80deg] md:w-32"
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

      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-14 md:max-w-4xl md:grid-cols-2 md:gap-x-12 md:gap-y-16">
        {reasons.map((reason, i) => {
          const Icon = REASON_ICONS[i] ?? Palette;
          const isLastOdd = reasons.length % 2 === 1 && i === reasons.length - 1;
          return (
            <FadeIn
              key={reason.titleLine1}
              className={
                isLastOdd
                  ? "md:col-span-2 md:flex md:flex-col md:items-center md:text-center"
                  : "md:flex md:flex-col md:items-center md:text-center"
              }
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-studio-lavande shadow-sm">
                <Icon className="h-6 w-6 text-studio-violet" />
              </div>
              <h3 className="mt-5 font-heading text-h2 text-studio-violet">
                <span className="block">{reason.titleLine1}</span>
                {reason.titleLine2 && (
                  <span className="block">{reason.titleLine2}</span>
                )}
              </h3>
              <p className="mt-3 max-w-md font-body text-sm text-studio-violet/70 md:text-base">
                {reason.description}
              </p>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

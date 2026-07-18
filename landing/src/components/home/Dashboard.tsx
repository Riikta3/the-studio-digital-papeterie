"use client";

import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { FadeIn } from "./FadeIn";

export function Dashboard() {
  const t = useTranslations("Dashboard");

  return (
    <section className="relative overflow-hidden bg-studio-beurre px-6 py-20 md:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <FadeIn>
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

          <p className="mx-auto mt-6 max-w-md font-body text-sm text-studio-violet/70 md:text-base">
            {t("subtitle")}
          </p>
        </FadeIn>
      </div>

      {/* Placeholder until a real dashboard screenshot is exported. */}
      <FadeIn
        amount={0.2}
        className="mx-auto mt-12 w-full max-w-4xl"
      >
        <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-studio-lavande/50 bg-white shadow-xl">
          <ImageIcon className="h-10 w-10 text-studio-lavande" />
          <p className="font-body text-h5 text-studio-violet/60">
            {t("placeholder")}
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

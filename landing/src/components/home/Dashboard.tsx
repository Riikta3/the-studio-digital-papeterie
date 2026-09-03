"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

import { DashboardDemo } from "./DashboardDemo";
import { FadeIn } from "./FadeIn";

export function Dashboard() {
  const t = useTranslations("Dashboard");

  return (
    <section
      id="espace-maries"
      className="relative overflow-hidden bg-studio-beurre px-6 py-20 md:px-12"
    >
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

      {/* The guided tour replaces the screenshot placeholder that stood here.
          Deliberately NOT wrapped in FadeIn: the block is ~840px tall, so
          FadeIn's `whileInView` threshold never resolves on a laptop viewport
          and the whole demo sat at opacity 0. The demo does its own reveal
          anyway — its IntersectionObserver starts playback once it is on
          screen, which is the effect FadeIn would have been buying. */}
      <div className="mx-auto mt-12 w-full max-w-5xl">
        <DashboardDemo />

        <p className="mt-4 text-center font-body text-xs text-studio-violet/50">
          {t("demo.note")}
        </p>
      </div>
    </section>
  );
}

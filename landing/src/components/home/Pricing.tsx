"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { ArrowRight, Check, Columns3, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { Link } from "@/navigation";

import { FadeIn } from "./FadeIn";
import {
  PricingCompareDialog,
  type CompareRow,
} from "./PricingCompareDialog";
import { TextureOverlay } from "./TextureOverlay";

type Plan = {
  id: string;
  name: string;
  price: string;
  positioning?: string;
  description: string;
  cta: string;
  features?: string[];
};

// Sur-mesure is the product we push: it carries the "most chosen" flag and is
// the tab the section opens on.
const HIGHLIGHTED_PLAN_ID = "sur-mesure";

export function Pricing() {
  const t = useTranslations("Pricing");
  const plans = t.raw("plans") as Plan[];
  const compareRows = t.raw("compareRows") as CompareRow[];

  const [selectedId, setSelectedId] = useState(HIGHLIGHTED_PLAN_ID);
  const [compareOpen, setCompareOpen] = useState(false);

  const selected = plans.find((p) => p.id === selectedId) ?? plans[0];

  return (
    <section
      id="tarifs"
      className="relative overflow-hidden bg-studio-violet px-6 py-20 md:px-12"
    >
      <TextureOverlay />
      <Image
        src="/images/hero-leaf-bottom.svg"
        alt=""
        width={141}
        height={188}
        className="pointer-events-none absolute -right-6 bottom-0 h-auto w-24 md:w-32"
      />

      <div className="relative mx-auto max-w-4xl">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-lavande">
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

          <h2 className="mt-4 font-heading text-h1 text-white">
            {t("titleLine1")}{" "}
            <span className="text-studio-jaune">{t("titleAccent")}</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl font-body text-sm text-white/80 md:text-base">
            {t("intro")}
          </p>
        </FadeIn>

        {/* Segmented selector. pt-3 on the rail leaves room for the "most
            chosen" pill to sit astride the highlighted tab's top edge. */}
        <FadeIn className="mt-12">
          <div
            role="tablist"
            aria-label={t("tablistLabel")}
            className="mx-auto grid max-w-2xl grid-cols-3 gap-1.5 rounded-[22px] bg-white/10 p-2 pt-5 sm:gap-2 sm:rounded-[28px] sm:p-3"
          >
            {plans.map((plan) => {
              const isSelected = plan.id === selectedId;
              const isRecommended = plan.id === HIGHLIGHTED_PLAN_ID;
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="tab"
                  id={`pricing-tab-${plan.id}`}
                  aria-selected={isSelected}
                  aria-controls={`pricing-panel-${plan.id}`}
                  onClick={() => setSelectedId(plan.id)}
                  className={cn(
                    "relative rounded-xl px-2 py-3 text-center transition-colors sm:rounded-2xl sm:px-4 sm:py-4",
                    isSelected
                      ? "bg-studio-jaune"
                      : "bg-white/5 hover:bg-white/10",
                  )}
                >
                  {isRecommended && (
                    <span className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-studio-violet px-2 py-0.5 font-body text-[9px] uppercase tracking-luxe text-studio-jaune ring-1 ring-studio-jaune/40 sm:px-3 sm:py-1 sm:text-[10px]">
                      <Sparkles
                        className="hidden h-3 w-3 sm:block"
                        aria-hidden="true"
                      />
                      {t("recommendedLabel")}
                    </span>
                  )}
                  <span
                    className={cn(
                      "block font-heading text-sm leading-tight sm:text-lg",
                      isSelected ? "text-studio-violet" : "text-white",
                    )}
                  >
                    {plan.name}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block font-heading text-base sm:text-xl",
                      isSelected ? "text-studio-violet" : "text-studio-jaune",
                    )}
                  >
                    {plan.price}
                  </span>
                </button>
              );
            })}
          </div>
        </FadeIn>

        <FadeIn className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="flex items-center gap-2 rounded-full border border-studio-lavande/40 px-5 py-2.5 font-body text-h5 uppercase tracking-luxe text-studio-lavande transition-colors hover:border-studio-jaune hover:text-studio-jaune"
          >
            <Columns3 className="h-4 w-4" aria-hidden="true" />
            {t("compareLabel")}
          </button>
        </FadeIn>

        {/* Detail panel for the selected plan. The height is content-driven and
            animated so switching tabs does not snap the page. */}
        <FadeIn className="mt-5">
          {/* Deliberately unanimated. Every entrance animation tried here —
              AnimatePresence, a keyed motion.div, animate-fade-in-up — starts
              from opacity 0, and this panel can be swapped while the section
              is off-screen, where nothing advances the animation and the card
              stays invisible. The toggle above already signals the change. */}
          <div
            role="tabpanel"
            id={`pricing-panel-${selected.id}`}
            aria-labelledby={`pricing-tab-${selected.id}`}
            className="rounded-3xl bg-studio-creme p-6 text-left shadow-2xl md:p-9"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-body text-h5 uppercase tracking-luxe text-studio-violet/60">
                  {t("planLabel")}
                </p>
                <h3 className="mt-1 font-heading text-h1 text-studio-violet">
                  {selected.name}
                </h3>
                {selected.positioning && (
                  <p className="mt-2 font-body text-sm text-studio-violet/70">
                    {selected.positioning}
                  </p>
                )}
              </div>
              <p className="flex items-baseline gap-2 font-heading text-studio-violet">
                <span className="font-body text-h5 uppercase tracking-luxe text-studio-violet/60">
                  {t("fromLabel")}
                </span>
                <span className="text-4xl md:text-5xl">{selected.price}</span>
              </p>
            </div>

            <p className="mt-6 max-w-2xl font-body text-sm text-studio-violet/80 md:text-base">
              {selected.description}
            </p>

            {selected.features && selected.features.length > 0 && (
              <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
                {selected.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 border-b border-studio-violet/10 py-2.5 font-body text-sm text-studio-violet"
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-studio-violet/10"
                      aria-hidden="true"
                    >
                      <Check className="h-3 w-3 text-studio-violet" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8">
              <Button variant="studio-violet" size="pill" asChild>
                <Link href={`/studio/start?plan=${selected.id}`}>
                  {selected.cta}
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                </Link>
              </Button>
            </div>
          </div>
        </FadeIn>

        <FadeIn>
          <p className="mt-10 text-center font-body text-sm text-white/70">
            {t("note")}
          </p>
        </FadeIn>
      </div>

      <PricingCompareDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        plans={plans}
        rows={compareRows}
        highlightedPlanId={HIGHLIGHTED_PLAN_ID}
        labels={{
          title: t("compareTitle"),
          subtitle: t("compareSubtitle"),
          featureHeader: t("compareFeatureHeader"),
          closeLabel: t("compareCloseLabel"),
          included: t("compareIncluded"),
          excluded: t("compareExcluded"),
          choose: t("compareChoose"),
        }}
      />
    </section>
  );
}

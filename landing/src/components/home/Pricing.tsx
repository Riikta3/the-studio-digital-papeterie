"use client";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { Link } from "@/navigation";

import { FadeIn } from "./FadeIn";
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

// Sur-mesure is the product we push. It gets the same treatment the previous
// two-card block already gave its winning side — solid studio-jaune fill,
// lifted shadow, larger price — rather than a new badge or animation.
const HIGHLIGHTED_PLAN_ID = "sur-mesure";

export function Pricing() {
  const t = useTranslations("Pricing");
  const plans = t.raw("plans") as Plan[];

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

      <div className="relative mx-auto max-w-6xl">
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

        {/* items-start, not items-stretch: Prestige carries nine included
            items and is meant to run taller than the other two. */}
        <div className="mt-16 grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-5">
          {plans.map((plan, i) => {
            const isHighlighted = plan.id === HIGHLIGHTED_PLAN_ID;
            return (
              <FadeIn
                key={plan.id}
                delay={i * 0.1}
                className={cn(isHighlighted && "md:-mt-4")}
              >
                <div
                  className={cn(
                    "flex flex-col rounded-2xl p-6 text-left md:p-7",
                    isHighlighted
                      ? "bg-studio-jaune shadow-xl"
                      : "border border-studio-lavande/50",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p
                      className={cn(
                        "font-body text-h5 tracking-luxe",
                        isHighlighted
                          ? "text-studio-violet"
                          : "text-studio-lavande",
                      )}
                    >
                      {plan.name}
                    </p>
                    {isHighlighted && (
                      <span className="shrink-0 font-body text-xs uppercase tracking-luxe text-studio-violet">
                        {t("recommendedLabel")}
                      </span>
                    )}
                  </div>

                  <p
                    className={cn(
                      "mt-4 font-heading",
                      isHighlighted
                        ? "text-4xl text-studio-violet md:text-5xl"
                        : "text-3xl text-studio-lavande md:text-4xl",
                    )}
                  >
                    {plan.price}
                  </p>

                  {plan.positioning && (
                    <p
                      className={cn(
                        "mt-3 font-body text-sm",
                        isHighlighted
                          ? "text-studio-violet/70"
                          : "text-white/70",
                      )}
                    >
                      {plan.positioning}
                    </p>
                  )}

                  <p
                    className={cn(
                      "mt-4 font-body text-sm",
                      isHighlighted
                        ? "text-studio-violet/80"
                        : "text-white/80",
                    )}
                  >
                    {plan.description}
                  </p>

                  {plan.features && plan.features.length > 0 && (
                    <ul className="mt-6 space-y-2.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 font-body text-sm text-white/85"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-studio-jaune"
                            aria-hidden="true"
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-8">
                    <Button
                      variant={isHighlighted ? "studio-violet" : "studio-outline"}
                      className="w-full"
                      asChild
                    >
                      <Link href={`/studio/start?plan=${plan.id}`}>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        <FadeIn>
          <p className="mt-12 text-center font-body text-sm text-white/70">
            {t("note")}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

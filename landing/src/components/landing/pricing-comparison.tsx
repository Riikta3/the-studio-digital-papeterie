"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const PAPER_PRICE = 860;
const STUDIO_PRICE = 149;
const SAVING = PAPER_PRICE - STUDIO_PRICE;

const FEATURE_KEYS = ["feature1", "feature2", "feature3", "feature4"] as const;

export function PricingComparison() {
  const t = useTranslations("PricingComparison");

  return (
    <section id="comparatif" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="rounded-2xl border border-border p-6 md:p-8 bg-background text-center"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-4">
                {t("paperLabel")}
              </p>
              <p className="font-heading text-5xl font-semibold text-muted-foreground/60 line-through">
                {PAPER_PRICE}€
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t("paperDetails")}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="rounded-2xl border-2 border-primary bg-primary/5 p-6 md:p-8 text-center relative"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                {t("savingBadge", { amount: SAVING })}
              </div>
              <p className="text-xs uppercase tracking-widest text-primary font-medium mb-4">
                {t("studioLabel")}
              </p>
              <p className="text-xs text-primary/60 mb-1">{t("studioFrom")}</p>
              <p className="font-heading text-5xl font-semibold text-primary">
                {STUDIO_PRICE}€
              </p>
              <p className="text-xs text-muted-foreground mt-2">{t("studioDetails")}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2"
          >
            {FEATURE_KEYS.map((key) => (
              <span key={key} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                {t(key)}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

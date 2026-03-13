"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Palette, Settings2, Send } from "lucide-react";

const STEPS = [
  { icon: Palette, titleKey: "step1Title", descKey: "step1Desc", number: "01" },
  { icon: Settings2, titleKey: "step2Title", descKey: "step2Desc", number: "02" },
  { icon: Send, titleKey: "step3Title", descKey: "step3Desc", number: "03" },
] as const;

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section id="comment-ca-marche" className="py-24 bg-secondary/30">
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

        <div className="grid md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-[1px] bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

          {STEPS.map(({ icon: Icon, titleKey, descKey, number }, i) => (
            <motion.div
              key={number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border border-primary/20 bg-background flex items-center justify-center shadow-sm">
                  <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                </div>
                <span className="absolute -top-2 -right-2 text-[10px] font-heading font-bold text-primary/40 tracking-widest">
                  {number}
                </span>
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground">
                {t(titleKey)}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm max-w-[240px]">
                {t(descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

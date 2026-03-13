"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, Leaf, RefreshCw, Wand2 } from "lucide-react";

const CARDS = [
  { icon: Sparkles, titleKey: "card1Title", descKey: "card1Desc" },
  { icon: Zap, titleKey: "card2Title", descKey: "card2Desc" },
  { icon: Leaf, titleKey: "card3Title", descKey: "card3Desc" },
  { icon: RefreshCw, titleKey: "card4Title", descKey: "card4Desc" },
  { icon: Wand2, titleKey: "card5Title", descKey: "card5Desc" },
] as const;

export function ValueCards() {
  const t = useTranslations("ValueCards");

  return (
    <section id="valeur" className="py-24 bg-background">
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CARDS.map(({ icon: Icon, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-border/40 bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                {t(titleKey)}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

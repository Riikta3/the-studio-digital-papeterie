"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CalendarDays, Images, Gift, Mail } from "lucide-react";

const FEATURES = [
  { icon: CalendarDays, titleKey: "feature1Title", descKey: "feature1Desc" },
  { icon: Images, titleKey: "feature2Title", descKey: "feature2Desc" },
  { icon: Gift, titleKey: "feature3Title", descKey: "feature3Desc" },
] as const;

export function Customization() {
  const t = useTranslations("Customization");

  return (
    <section id="sur-mesure" className="py-24 bg-secondary/30">
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
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">{t("subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {FEATURES.map(({ icon: Icon, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-2xl border border-border/40 bg-background hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <Icon className="w-8 h-8 text-primary mb-4" strokeWidth={1.5} />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                {t(titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t(descKey)}</p>
            </motion.div>
          ))}
        </div>

        {/* Bespoke CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto rounded-2xl border border-primary/20 bg-primary/5 p-10 text-center"
        >
          <span className="inline-block bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {t("bespokeBadge")}
          </span>
          <h3 className="font-heading text-2xl font-semibold text-foreground mb-3">
            {t("bespokeTitle")}
          </h3>
          <p className="text-muted-foreground text-sm mb-6">{t("bespokeDesc")}</p>
          <a
            href={`mailto:${t("bespokeEmail")}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Mail className="w-4 h-4" />
            {t("bespokeButton")}
          </a>
        </motion.div>
      </div>
    </section>
  );
}

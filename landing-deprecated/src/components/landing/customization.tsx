"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Phone, Compass, Paintbrush2, Rocket, ArrowRight } from "lucide-react";
import { EmailLink } from "@/components/ui/EmailLink";

const STEPS = [
  { icon: Phone, titleKey: "step1Title", descKey: "step1Desc", number: "01" },
  { icon: Compass, titleKey: "step2Title", descKey: "step2Desc", number: "02" },
  { icon: Paintbrush2, titleKey: "step3Title", descKey: "step3Desc", number: "03" },
  { icon: Rocket, titleKey: "step4Title", descKey: "step4Desc", number: "04" },
] as const;

export function Customization() {
  const t = useTranslations("Customization");

  return (
    <section id="sur-mesure" className="py-24 bg-background relative overflow-hidden">
      {/* Background patterns could go here if needed, but keeping it clean for now */}
      <div className="container mx-auto px-4">
        {/* Header Centré */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
          <p className="mt-6 text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Système d'étapes (01-02-03-04) - Style HowItWorks */}
        <div className="relative">
          {/* Connector Line for Desktop (01 -> 02 and 03 -> 04) - Complex logic for 4 steps in 2x2 */}
          {/* We'll use a simpler grid for 4 steps but maintain the HowItWorks visual language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
            {/* Desktop Connectors (between 1-2, 2-3, 3-4) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 -z-0" />

            {STEPS.map(({ icon: Icon, titleKey, descKey, number }, i) => (
              <motion.div
                key={titleKey}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-6"
              >
                <div className="relative">
                  {/* Circle Indicator - HowItWorks style */}
                  <div className="w-20 h-20 rounded-full border border-primary/20 bg-background flex items-center justify-center shadow-sm group hover:border-primary/40 transition-colors duration-300">
                    <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-heading text-xl font-semibold text-foreground">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
                    {t(descKey)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mt-20"
        >
          <EmailLink
            email={t("bespokeEmail")}
            className="group inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-base font-medium text-primary-foreground shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-95"
          >
            {t("bespokeButton")}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </EmailLink>
        </motion.div>
      </div>
    </section>
  );
}

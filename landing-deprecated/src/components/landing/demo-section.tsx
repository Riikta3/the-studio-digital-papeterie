"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

const DEMO_WEDDING_CODE = process.env.NEXT_PUBLIC_DEMO_WEDDING_CODE;

const THEME_SWATCHES = [
  { bg: "from-[#fdf5f7] to-[#f0d8dc]", label: "Floral" },
  { bg: "from-[#f5f3ee] to-[#e8dcc8]", label: "Bohème" },
  { bg: "from-[#1b2a41] to-[#2d4566]", label: "Royal" },
];

export function DemoSection() {
  const t = useTranslations("DemoSection");

  return (
    <section id="apercu" className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center gap-12"
        >
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
              {t("eyebrow")}
            </p>
            <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
              {t("title")}{" "}
              <span className="italic text-primary">{t("titleAccent")}</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              {t("subtitle")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-10">
            {/* Phone mockup */}
            <div
              className="w-[160px] h-[280px] rounded-[24px] border-2 border-primary/20 bg-white shadow-2xl overflow-hidden flex items-center justify-center"
              style={{ transform: "rotate(-4deg)" }}
            >
              <div className="w-[148px] h-[268px] rounded-[20px] bg-gradient-to-b from-[#fdf5f7] to-[#fdfbf7] flex flex-col items-center justify-center gap-3 p-4">
                <div className="relative w-16 h-11 border border-primary/30 rounded-sm bg-white shadow-sm">
                  <div
                    className="absolute inset-x-0 top-0 w-0 h-0 border-l-[32px] border-r-[32px] border-t-[20px] border-l-transparent border-r-transparent"
                    style={{ borderTopColor: "rgba(136,32,64,0.12)" }}
                  />
                  <div className="absolute inset-x-0 bottom-2 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary/80" />
                  </div>
                </div>
                <p className="font-heading italic text-primary text-sm text-center leading-tight">
                  Sophie & Thomas
                </p>
                <p className="text-[10px] text-muted-foreground text-center">14 juin 2026</p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              {DEMO_WEDDING_CODE ? (
                <Link
                  href={`/invitation/${DEMO_WEDDING_CODE}`}
                  className="group flex items-center gap-3 rounded-2xl bg-primary px-8 py-5 text-primary-foreground shadow-xl hover:-translate-y-1 transition-all duration-300 active:scale-95"
                >
                  <span className="font-heading text-lg italic font-semibold">
                    {t("ctaButton")}
                  </span>
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : null}
              <p className="text-xs text-muted-foreground">{t("ctaSubtext")}</p>
            </div>
          </div>

          {/* Theme swatches */}
          <div className="flex gap-4">
            {THEME_SWATCHES.map(({ bg, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`w-20 h-14 rounded-xl bg-gradient-to-br ${bg} border border-primary/10 shadow-sm`} />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

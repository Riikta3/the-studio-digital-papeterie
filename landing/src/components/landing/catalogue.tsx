"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

type OpeningType = "all" | "envelope" | "curtains" | "doors";

interface Theme {
  key: string;
  nameKey: string;
  opening: Exclude<OpeningType, "all">;
  openingLabelKey: string;
  bg: string;
  isNew?: boolean;
  tall?: boolean;
}

const THEMES: Theme[] = [
  { key: "floral", nameKey: "floral", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#fdf5f7] to-[#f0d8dc]", isNew: true, tall: true },
  { key: "boho", nameKey: "boho", opening: "curtains", openingLabelKey: "filterCurtains", bg: "from-[#f5f3ee] to-[#e8dcc8]" },
  { key: "minimalist", nameKey: "minimalist", opening: "doors", openingLabelKey: "filterDoors", bg: "from-[#f5f5f3] to-[#e0ddd8]" },
  { key: "royal", nameKey: "royal", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#1b2a41] to-[#2d4566]", tall: true },
  { key: "modern", nameKey: "modern", opening: "curtains", openingLabelKey: "filterCurtains", bg: "from-[#ede8f5] to-[#d5caea]", isNew: true },
  { key: "champetre", nameKey: "champetre", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#eef5e8] to-[#d5e8c8]", tall: true },
  { key: "voyage", nameKey: "voyage", opening: "doors", openingLabelKey: "filterDoors", bg: "from-[#e8f0f8] to-[#c8daf0]" },
  { key: "bridgerton", nameKey: "bridgerton", opening: "curtains", openingLabelKey: "filterCurtains", bg: "from-[#f8f0f5] to-[#f0d8e8]", isNew: true },
  { key: "oriental", nameKey: "oriental", opening: "envelope", openingLabelKey: "filterEnvelope", bg: "from-[#f8f0e0] to-[#f0d8a8]", tall: true },
];

const FILTERS: { key: OpeningType; labelKey: string }[] = [
  { key: "all", labelKey: "filterAll" },
  { key: "envelope", labelKey: "filterEnvelope" },
  { key: "curtains", labelKey: "filterCurtains" },
  { key: "doors", labelKey: "filterDoors" },
];

export function Catalogue() {
  const t = useTranslations("Catalogue");
  const [activeFilter, setActiveFilter] = useState<OpeningType>("all");

  const filtered = THEMES.filter(
    (th) => activeFilter === "all" || th.opening === activeFilter,
  );

  return (
    <section id="themes" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </motion.div>

        {/* Tabs filter */}
        <div className="flex justify-center gap-8 mb-10 border-b border-border/40">
          {FILTERS.map(({ key, labelKey }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`pb-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px] ${
                activeFilter === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="columns-2 md:columns-3 lg:columns-4 gap-4"
        >
          {filtered.map((theme) => (
            <div
              key={theme.key}
              className="break-inside-avoid mb-4 rounded-2xl overflow-hidden border border-border/20 hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
            >
              <div
                className={`bg-gradient-to-br ${theme.bg} flex items-center justify-center relative ${
                  theme.tall ? "h-48" : "h-32"
                }`}
              >
                {theme.isNew && (
                  <span className="absolute top-3 right-3 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                    {t("badgeNew")}
                  </span>
                )}
              </div>
              <div className="p-3 bg-white flex items-center justify-between gap-2">
                <p className="font-heading text-sm font-semibold text-foreground">
                  {t(`themes.${theme.nameKey}`)}
                </p>
                <span className="text-[9px] text-primary/60 border border-primary/15 rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                  {t(theme.openingLabelKey)}
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

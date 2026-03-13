"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/navigation";
import { ExternalLink } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

type OpeningType = "envelope" | "portes" | "rideaux";

interface Subtype {
  key: string;
  labelKey: string;
  gradient: string;
  light?: boolean; // light background (add border)
  fontStyle: "cormorant" | "cinzel" | "inter";
  phoneBg: string;
  phoneAccent: string;
}

interface OpeningCategory {
  key: OpeningType;
  icon: string;
  labelKey: string;
  subtypes: Subtype[];
}

const OPENING_CATEGORIES: OpeningCategory[] = [
  {
    key: "envelope",
    icon: "✉",
    labelKey: "openingEnvelope",
    subtypes: [
      {
        key: "envelope-rouge",
        labelKey: "subtypeRouge",
        gradient: "linear-gradient(135deg,#3a0a14,#c04060)",
        fontStyle: "cormorant",
        phoneBg: "linear-gradient(160deg,#3a0a14 0%,#7a1a2e 60%,#c04060 100%)",
        phoneAccent: "#f9c8d4",
      },
      {
        key: "envelope-noire",
        labelKey: "subtypeNoire",
        gradient: "linear-gradient(135deg,#0a0a0a,#2d2d2d)",
        fontStyle: "cormorant",
        phoneBg: "linear-gradient(160deg,#0a0a0a 0%,#1a1a1a 60%,#2d2d2d 100%)",
        phoneAccent: "#c9a96e",
      },
      {
        key: "envelope-blanche",
        labelKey: "subtypeBlanche",
        gradient: "linear-gradient(135deg,#fff,#f5ede5)",
        light: true,
        fontStyle: "cormorant",
        phoneBg: "linear-gradient(160deg,#fff 0%,#fdf8f5 60%,#f5ede5 100%)",
        phoneAccent: "#882040",
      },
      {
        key: "envelope-royal",
        labelKey: "subtypeRoyal",
        gradient: "linear-gradient(135deg,#1b2a41,#2d4566)",
        fontStyle: "cinzel",
        phoneBg: "linear-gradient(160deg,#1b2a41 0%,#243550 60%,#2d4566 100%)",
        phoneAccent: "#c9a96e",
      },
      {
        key: "envelope-sceau",
        labelKey: "subtypeSceau",
        gradient: "linear-gradient(135deg,#fdf8f0,#e8d0b0)",
        light: true,
        fontStyle: "cormorant",
        phoneBg: "linear-gradient(160deg,#fdf8f0 0%,#f5e8d5 60%,#e8d0b0 100%)",
        phoneAccent: "#8b5e3c",
      },
    ],
  },
  {
    key: "portes",
    icon: "🚪",
    labelKey: "openingPortes",
    subtypes: [
      {
        key: "portes-royal",
        labelKey: "subtypeRoyal",
        gradient: "linear-gradient(135deg,#1b2a41,#2d4566)",
        fontStyle: "cinzel",
        phoneBg: "linear-gradient(160deg,#1b2a41,#2d4566)",
        phoneAccent: "#c9a96e",
      },
      {
        key: "portes-oriental",
        labelKey: "subtypeOriental",
        gradient: "linear-gradient(135deg,#3a1a08,#c06030)",
        fontStyle: "cormorant",
        phoneBg: "linear-gradient(160deg,#3a1a08,#6b3318,#c06030)",
        phoneAccent: "#f0c080",
      },
      {
        key: "portes-boho",
        labelKey: "subtypeBoho",
        gradient: "linear-gradient(135deg,#f5ede5,#d4b89a)",
        light: true,
        fontStyle: "cormorant",
        phoneBg: "linear-gradient(160deg,#f5ede5,#e8d5c5,#d4b89a)",
        phoneAccent: "#8b5e3c",
      },
    ],
  },
  {
    key: "rideaux",
    icon: "✨",
    labelKey: "openingRideaux",
    subtypes: [
      {
        key: "rideaux-theatre",
        labelKey: "subtypeTheatre",
        gradient: "linear-gradient(135deg,#1a0a14,#6a1a35)",
        fontStyle: "cormorant",
        phoneBg: "linear-gradient(160deg,#1a0a14,#3a0a20,#6a1a35)",
        phoneAccent: "#e8c87a",
      },
      {
        key: "rideaux-voilage",
        labelKey: "subtypeVoilage",
        gradient: "linear-gradient(135deg,#f5f0f8,#ddd0f0)",
        light: true,
        fontStyle: "inter",
        phoneBg: "linear-gradient(160deg,#f5f0f8,#ede5f5,#ddd0f0)",
        phoneAccent: "#7c50c8",
      },
      {
        key: "rideaux-royal",
        labelKey: "subtypeRoyal",
        gradient: "linear-gradient(135deg,#0a1428,#2a4068)",
        fontStyle: "cinzel",
        phoneBg: "linear-gradient(160deg,#0a1428,#1a2a48,#2a4068)",
        phoneAccent: "#d4a860",
      },
    ],
  },
];

interface SiteTheme {
  key: string;
  labelKey: string;
  gradient: string;
  light?: boolean;
}

const SITE_THEMES: SiteTheme[] = [
  { key: "floral",      labelKey: "themeFloral",      gradient: "linear-gradient(135deg,#fdf5f7,#f0d8dc)" },
  { key: "boho",        labelKey: "themeBoho",         gradient: "linear-gradient(135deg,#fdf8f5,#f0e0d5)" },
  { key: "royal",       labelKey: "themeRoyal",        gradient: "linear-gradient(135deg,#1b2a41,#2d4566)" },
  { key: "oriental",    labelKey: "themeOriental",     gradient: "linear-gradient(135deg,#fdf5e8,#f0d8a0)" },
  { key: "minimalist",  labelKey: "themeMinimaliste",  gradient: "linear-gradient(135deg,#f8f8f8,#e0e0e0)", light: true },
  { key: "champetre",   labelKey: "themeChampetre",    gradient: "linear-gradient(135deg,#eef5e8,#d5e8c8)" },
  { key: "modern",      labelKey: "themeModern",       gradient: "linear-gradient(135deg,#f3effe,#ddd0f5)" },
  { key: "voyage",      labelKey: "themeVoyage",       gradient: "linear-gradient(135deg,#e8f0f8,#c8daf0)" },
];

const DEMO_WEDDING_CODE = process.env.NEXT_PUBLIC_DEMO_WEDDING_CODE;

// ─── Phone preview ────────────────────────────────────────────────────────────

function PhonePreview({ subtype }: { subtype: Subtype }) {
  const isCinzel = subtype.fontStyle === "cinzel";
  const isInter = subtype.fontStyle === "inter";
  const phoneTextColor = subtype.light ? "#292929" : "#f0ece4";

  return (
    <div
      className="w-[130px] h-[240px] rounded-[24px] overflow-hidden shadow-2xl flex-shrink-0"
      style={{
        transform: "rotate(-3deg)",
        border: "2px solid rgba(136,32,64,0.25)",
      }}
    >
      <div
        className="w-full h-full flex flex-col items-center justify-center gap-[6px] px-[14px] relative"
        style={{ background: subtype.phoneBg, color: phoneTextColor }}
      >
        {/* Notch */}
        <div
          className="absolute top-[10px] left-1/2 -translate-x-1/2 w-8 h-[4px] rounded-full"
          style={{ background: "rgba(0,0,0,0.15)" }}
        />

        <p
          className="text-[7px] uppercase tracking-[0.2em] opacity-60"
          style={{ color: subtype.phoneAccent, fontFamily: isCinzel ? "'Cinzel', serif" : undefined }}
        >
          Nous nous marions
        </p>

        <div className="w-6 h-px opacity-30" style={{ background: subtype.phoneAccent }} />

        <p
          className="text-[22px] opacity-30 leading-none"
          style={{
            fontFamily: isCinzel ? "'Cinzel', serif" : isInter ? "'Inter', sans-serif" : "'Cormorant Garamond', serif",
            fontStyle: isCinzel || isInter ? "normal" : "italic",
          }}
        >
          &amp;
        </p>

        <p
          className="text-[11px] text-center leading-snug font-medium"
          style={{
            fontFamily: isCinzel ? "'Cinzel', serif" : isInter ? "'Inter', sans-serif" : "'Cormorant Garamond', serif",
            fontStyle: isCinzel || isInter ? "normal" : "italic",
            color: subtype.phoneAccent,
          }}
        >
          Sophie<br />& Thomas
        </p>

        <p
          className="text-[7px] tracking-[0.12em] opacity-50"
          style={{ color: subtype.phoneAccent }}
        >
          14 · 06 · 2026
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Catalogue() {
  const t = useTranslations("Catalogue");

  const [openingType, setOpeningType] = useState<OpeningType>("envelope");
  const [selectedSubtypeKey, setSelectedSubtypeKey] = useState("envelope-rouge");
  const [selectedThemeKey, setSelectedThemeKey] = useState("floral");

  const currentCategory = OPENING_CATEGORIES.find((c) => c.key === openingType)!;
  const currentSubtype =
    currentCategory.subtypes.find((s) => s.key === selectedSubtypeKey) ??
    currentCategory.subtypes[0];

  function handleOpeningChange(type: OpeningType) {
    setOpeningType(type);
    // Auto-select first subtype of the new category
    const cat = OPENING_CATEGORIES.find((c) => c.key === type)!;
    setSelectedSubtypeKey(cat.subtypes[0].key);
  }

  return (
    <section id="themes" className="py-24 bg-background overflow-hidden">
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

        {/* Main layout: selectors left, phone right */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-card rounded-3xl border border-border/40 shadow-xl p-6 md:p-8 flex gap-8 items-start">

            {/* ── Left column: selectors ── */}
            <div className="flex-1 flex flex-col gap-6 min-w-0">

              {/* Level 1: Opening type */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                  {t("step1Label")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {OPENING_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleOpeningChange(cat.key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200 ${
                        openingType === cat.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {t(cat.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level 2: Sub-type */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                  {t("step2Label")}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={openingType}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2 flex-wrap"
                  >
                    {currentCategory.subtypes.map((sub) => (
                      <button
                        key={sub.key}
                        onClick={() => setSelectedSubtypeKey(sub.key)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-[1.5px] transition-all duration-200 min-w-[56px] ${
                          selectedSubtypeKey === sub.key
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/30"
                        }`}
                      >
                        <div
                          className={`w-10 h-7 rounded-md ${sub.light ? "border border-border/60" : ""}`}
                          style={{ background: sub.gradient }}
                        />
                        <span className="text-[9px] font-semibold text-foreground leading-none">
                          {t(sub.labelKey)}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/40" />

              {/* Level 3: Site theme */}
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                  {t("step3Label")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {SITE_THEMES.map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => setSelectedThemeKey(theme.key)}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-7 h-7 rounded-lg transition-all duration-200 ${theme.light ? "border border-border/60" : ""} ${
                          selectedThemeKey === theme.key
                            ? "scale-110 ring-2 ring-primary ring-offset-1"
                            : "hover:scale-105"
                        }`}
                        style={{ background: theme.gradient }}
                      />
                      <span
                        className={`text-[8px] font-medium leading-none ${
                          selectedThemeKey === theme.key ? "text-primary font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {t(theme.labelKey)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              {DEMO_WEDDING_CODE && (
                <div className="mt-2">
                  <Link
                    href={`/invitation/${DEMO_WEDDING_CODE}`}
                    className="group inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/20"
                  >
                    <span className="font-heading italic">{t("ctaButton")}</span>
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* ── Right column: phone preview ── */}
            <div className="hidden sm:flex flex-col items-center gap-3 pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSubtype.key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  <PhonePreview subtype={currentSubtype} />
                </motion.div>
              </AnimatePresence>
              <p className="text-[9px] text-muted-foreground text-center leading-relaxed max-w-[90px]">
                {t("phoneCaption")}
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { Link } from "@/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

// ─── Site themes (drive the phone preview colors) ────────────────────────────

interface SiteTheme {
  key: string;
  labelKey: string;
  swatchGradient: string;
  swatchLight?: boolean;
  // Phone background
  phoneBg: string;
  phoneTextColor: string; // main body text
  phoneAccentColor: string; // names, divider, labels
  fontStyle: "cormorant" | "cinzel" | "inter";
}

const SITE_THEMES: SiteTheme[] = [
  {
    key: "floral",
    labelKey: "themeFloral",
    swatchGradient: "linear-gradient(135deg,#fdf5f7,#f0d8dc)",
    phoneBg: "linear-gradient(160deg,#fdf5f7 0%,#fae8ec 60%,#f0d0d8 100%)",
    phoneTextColor: "#292929",
    phoneAccentColor: "#882040",
    fontStyle: "cormorant",
  },
  {
    key: "boho",
    labelKey: "themeBoho",
    swatchGradient: "linear-gradient(135deg,#fdf8f5,#f0e0d5)",
    phoneBg: "linear-gradient(160deg,#fdf8f5 0%,#f5e8d8 60%,#e8d0b8 100%)",
    phoneTextColor: "#3a2010",
    phoneAccentColor: "#8b5e3c",
    fontStyle: "cormorant",
  },
  {
    key: "royal",
    labelKey: "themeRoyal",
    swatchGradient: "linear-gradient(135deg,#1b2a41,#2d4566)",
    phoneBg: "linear-gradient(160deg,#1b2a41 0%,#243550 60%,#2d4566 100%)",
    phoneTextColor: "#e8dcc8",
    phoneAccentColor: "#c9a96e",
    fontStyle: "cinzel",
  },
  {
    key: "oriental",
    labelKey: "themeOriental",
    swatchGradient: "linear-gradient(135deg,#fdf5e8,#f0d8a0)",
    phoneBg: "linear-gradient(160deg,#fdf5e8 0%,#f5e0b0 60%,#e8c878 100%)",
    phoneTextColor: "#2a1a00",
    phoneAccentColor: "#8b4a00",
    fontStyle: "cormorant",
  },
  {
    key: "minimalist",
    labelKey: "themeMinimaliste",
    swatchGradient: "linear-gradient(135deg,#f8f8f8,#e0e0e0)",
    swatchLight: true,
    phoneBg: "linear-gradient(160deg,#ffffff 0%,#f8f8f6 60%,#f0efec 100%)",
    phoneTextColor: "#292929",
    phoneAccentColor: "#292929",
    fontStyle: "inter",
  },
  {
    key: "champetre",
    labelKey: "themeChampetre",
    swatchGradient: "linear-gradient(135deg,#eef5e8,#d5e8c8)",
    phoneBg: "linear-gradient(160deg,#eef5e8 0%,#d8eccc 60%,#c0e0a8 100%)",
    phoneTextColor: "#1a3010",
    phoneAccentColor: "#3a6020",
    fontStyle: "cormorant",
  },
  {
    key: "travel",
    labelKey: "themeTravel",
    swatchGradient: "linear-gradient(135deg,#f3effe,#ddd0f5)",
    phoneBg: "linear-gradient(160deg,#f3effe 0%,#e5d5f8 60%,#d0b8f0 100%)",
    phoneTextColor: "#1a0a30",
    phoneAccentColor: "#7c3aaa",
    fontStyle: "inter",
  },
  {
    key: "voyage",
    labelKey: "themeVoyage",
    swatchGradient: "linear-gradient(135deg,#e8f0f8,#c8daf0)",
    phoneBg: "linear-gradient(160deg,#e8f0f8 0%,#ccddf0 60%,#b0cce8 100%)",
    phoneTextColor: "#0a1a30",
    phoneAccentColor: "#1a5080",
    fontStyle: "cormorant",
  },
];

// ─── Opening types (drive the animation badge, not the phone colors) ──────────

type OpeningType = "envelope" | "portes" | "rideaux";

interface Subtype {
  key: string;
  labelKey: string;
  gradient: string;
  light?: boolean;
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
      },
      {
        key: "envelope-noire",
        labelKey: "subtypeNoire",
        gradient: "linear-gradient(135deg,#0a0a0a,#2d2d2d)",
      },
      {
        key: "envelope-blanche",
        labelKey: "subtypeBlanche",
        gradient: "linear-gradient(135deg,#fff,#f5ede5)",
        light: true,
      },
      {
        key: "envelope-royal",
        labelKey: "subtypeRoyal",
        gradient: "linear-gradient(135deg,#1b2a41,#2d4566)",
      },
      {
        key: "envelope-sceau",
        labelKey: "subtypeSceau",
        gradient: "linear-gradient(135deg,#fdf8f0,#e8d0b0)",
        light: true,
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
      },
      {
        key: "portes-oriental",
        labelKey: "subtypeOriental",
        gradient: "linear-gradient(135deg,#3a1a08,#c06030)",
      },
      {
        key: "portes-boho",
        labelKey: "subtypeBoho",
        gradient: "linear-gradient(135deg,#f5ede5,#d4b89a)",
        light: true,
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
      },
      {
        key: "rideaux-voilage",
        labelKey: "subtypeVoilage",
        gradient: "linear-gradient(135deg,#f5f0f8,#ddd0f0)",
        light: true,
      },
      {
        key: "rideaux-royal",
        labelKey: "subtypeRoyal",
        gradient: "linear-gradient(135deg,#0a1428,#2a4068)",
      },
    ],
  },
];

const DEMO_WEDDING_CODE = process.env.NEXT_PUBLIC_DEMO_WEDDING_CODE;

// ─── Opening animation visual (small overlay inside phone) ───────────────────

function OpeningBadge({
  openingType,
  subtype,
  theme,
}: {
  openingType: OpeningType;
  subtype: Subtype;
  theme: SiteTheme;
}) {
  const icon =
    openingType === "envelope" ? "✉" : openingType === "portes" ? "🚪" : "✨";
  const subtypeGradient = subtype.gradient;

  return (
    <div
      className='absolute inset-0 flex flex-col items-center justify-center gap-2'
      style={{ background: subtypeGradient, opacity: 0.92 }}
    >
      {/* Envelope flap / door / curtain icon overlay */}
      <span className='text-3xl opacity-80'>{icon}</span>
      <div
        className='w-10 h-px'
        style={{ background: theme.phoneAccentColor, opacity: 0.5 }}
      />
    </div>
  );
}

// ─── Phone preview ────────────────────────────────────────────────────────────

function PhonePreview({
  theme,
  openingType,
  subtype,
  showSite,
}: {
  theme: SiteTheme;
  openingType: OpeningType;
  subtype: Subtype;
  showSite: boolean;
}) {
  const isCinzel = theme.fontStyle === "cinzel";
  const isInter = theme.fontStyle === "inter";
  const nameFont = isCinzel
    ? "'Cinzel', serif"
    : isInter
      ? "'Inter', sans-serif"
      : "'Cormorant Garamond', serif";
  const nameStyle = isCinzel || isInter ? "normal" : "italic";

  return (
    <div
      className='relative'
      style={{ width: 180, height: 340 }}
    >
      {/* Phone shell */}
      <div
        className='w-full h-full rounded-[32px] overflow-hidden shadow-2xl'
        style={{ border: "3px solid rgba(136,32,64,0.2)" }}
      >
        <AnimatePresence mode='wait'>
          {showSite ? (
            // ── Site theme view ──
            <motion.div
              key={`site-${theme.key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='w-full h-full flex flex-col items-center justify-center gap-2 px-4 relative'
              style={{ background: theme.phoneBg, color: theme.phoneTextColor }}
            >
              {/* Notch */}
              <div
                className='absolute top-3 left-1/2 -translate-x-1/2 w-9 h-[5px] rounded-full'
                style={{ background: "rgba(0,0,0,0.12)" }}
              />

              <p
                className='text-[8px] uppercase tracking-[0.2em] opacity-60'
                style={{ color: theme.phoneAccentColor, fontFamily: nameFont }}
              >
                Nous nous marions
              </p>

              <div
                className='w-8 h-px opacity-30'
                style={{ background: theme.phoneAccentColor }}
              />

              <p
                className='text-[28px] opacity-25 leading-none'
                style={{ fontFamily: nameFont, fontStyle: nameStyle }}
              >
                &amp;
              </p>

              <p
                className='text-[13px] text-center leading-snug font-medium'
                style={{
                  fontFamily: nameFont,
                  fontStyle: nameStyle,
                  color: theme.phoneAccentColor,
                }}
              >
                Sophie
                <br />& Thomas
              </p>

              <p
                className='text-[8px] tracking-[0.12em] opacity-50'
                style={{ color: theme.phoneAccentColor }}
              >
                14 · 06 · 2026
              </p>

              {/* Mini scrollable content preview */}
              <div className='absolute bottom-6 left-4 right-4 flex flex-col gap-1.5 opacity-30'>
                <div
                  className='h-1 rounded-full w-3/4 mx-auto'
                  style={{ background: theme.phoneAccentColor }}
                />
                <div
                  className='h-1 rounded-full w-1/2 mx-auto'
                  style={{ background: theme.phoneAccentColor }}
                />
              </div>
            </motion.div>
          ) : (
            // ── Opening animation view ──
            <motion.div
              key={`opening-${subtype.key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='w-full h-full flex flex-col items-center justify-center gap-3 relative'
              style={{ background: subtype.gradient }}
            >
              {/* Notch */}
              <div
                className='absolute top-3 left-1/2 -translate-x-1/2 w-9 h-[5px] rounded-full'
                style={{ background: "rgba(255,255,255,0.15)" }}
              />

              <span className='text-4xl'>
                {openingType === "envelope"
                  ? "✉"
                  : openingType === "portes"
                    ? "🚪"
                    : "✨"}
              </span>

              <p className='text-[10px] uppercase tracking-[0.2em] text-white/60 text-center px-4'>
                Animation
                <br />
                d&apos;introduction
              </p>

              <div className='w-8 h-px bg-white/30' />

              <p className='text-[8px] text-white/50 text-center px-4'>
                {subtype.light ? "Enveloppe légère" : "Style élégant"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Catalogue() {
  const t = useTranslations("Catalogue");

  const [openingType, setOpeningType] = useState<OpeningType>("envelope");
  const [selectedSubtypeKey, setSelectedSubtypeKey] =
    useState("envelope-rouge");
  const [selectedThemeKey, setSelectedThemeKey] = useState("floral");
  const [showSite, setShowSite] = useState(false);

  const currentCategory = OPENING_CATEGORIES.find(
    (c) => c.key === openingType,
  )!;
  const currentSubtype =
    currentCategory.subtypes.find((s) => s.key === selectedSubtypeKey) ??
    currentCategory.subtypes[0];
  const currentTheme = SITE_THEMES.find((th) => th.key === selectedThemeKey)!;

  function handleOpeningChange(type: OpeningType) {
    setOpeningType(type);
    const cat = OPENING_CATEGORIES.find((c) => c.key === type)!;
    setSelectedSubtypeKey(cat.subtypes[0].key);
    setShowSite(false); // show animation view when switching opening type
  }

  function handleThemeChange(key: string) {
    setSelectedThemeKey(key);
    setShowSite(true); // show site view when picking a theme
  }

  return (
    <section
      id='themes'
      className='py-24 bg-background overflow-hidden'
    >
      <div className='container mx-auto px-4'>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className='text-center mb-12'
        >
          <p className='text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3'>
            {t("eyebrow")}
          </p>
          <h2 className='font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight'>
            {t("title")}{" "}
            <span className='italic text-primary'>{t("titleAccent")}</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className='max-w-3xl mx-auto'
        >
          <div className='bg-card rounded-3xl border border-border/40 shadow-xl p-6 md:p-8 flex flex-col sm:flex-row gap-8 sm:gap-10 items-start'>
            {/* ── Left column: selectors ── */}
            <div className='flex-1 flex flex-col gap-6 min-w-0'>
              {/* Level 1: Opening type */}
              <div>
                <p className='text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2'>
                  {t("step1Label")}
                </p>
                <div className='flex gap-2 flex-wrap'>
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
                <p className='text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2'>
                  {t("step2Label")}
                </p>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={openingType}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.2 }}
                    className='flex gap-2 flex-wrap'
                  >
                    {currentCategory.subtypes.map((sub) => (
                      <button
                        key={sub.key}
                        onClick={() => {
                          setSelectedSubtypeKey(sub.key);
                          setShowSite(false);
                        }}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-[1.5px] transition-all duration-200 min-w-[52px] ${
                          selectedSubtypeKey === sub.key
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/30"
                        }`}
                      >
                        <div
                          className={`w-10 h-7 rounded-md ${sub.light ? "border border-border/60" : ""}`}
                          style={{ background: sub.gradient }}
                        />
                        <span className='text-[9px] font-semibold text-foreground leading-none'>
                          {t(sub.labelKey)}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Divider */}
              <div className='h-px bg-border/40' />

              {/* Level 3: Site theme */}
              <div>
                <p className='text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2'>
                  {t("step3Label")}
                </p>
                <div className='flex gap-2.5 flex-wrap'>
                  {SITE_THEMES.map((theme) => (
                    <button
                      key={theme.key}
                      onClick={() => handleThemeChange(theme.key)}
                      className='flex flex-col items-center gap-1'
                    >
                      <div
                        className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                          theme.swatchLight ? "border border-border/60" : ""
                        } ${
                          selectedThemeKey === theme.key
                            ? "scale-115 ring-2 ring-primary ring-offset-1"
                            : "hover:scale-105"
                        }`}
                        style={{ background: theme.swatchGradient }}
                      />
                      <span
                        className={`text-[8px] font-medium leading-none ${
                          selectedThemeKey === theme.key
                            ? "text-primary font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {t(theme.labelKey)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className='mt-4 pt-4 border-t border-border/40'>
                <p className='text-[10px] text-muted-foreground mb-2.5'>
                  {t("ctaHint")}
                </p>
                <Link
                  href={`/invitation/${DEMO_WEDDING_CODE ?? "demo"}`}
                  className='group relative inline-flex items-center gap-3 bg-primary text-primary-foreground px-5 py-3 rounded-2xl font-semibold hover:-translate-y-0.5 transition-all duration-200 active:scale-95 shadow-lg shadow-primary/25 overflow-hidden'
                >
                  {/* shimmer */}
                  <span className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent' />
                  <span className='text-sm font-heading italic'>
                    {t("ctaButton")}
                  </span>
                  <ExternalLink className='h-3.5 w-3.5 opacity-70 transition-transform group-hover:translate-x-0.5' />
                </Link>
              </div>
            </div>

            {/* ── Right column: phone preview ── */}
            <div className='flex flex-col items-center gap-2 pt-0 flex-shrink-0 w-full sm:w-auto order-first sm:order-last'>
              <p className='text-[9px] text-muted-foreground text-center leading-relaxed'>
                {t("phoneCaption")}
              </p>
              <PhonePreview
                theme={currentTheme}
                openingType={openingType}
                subtype={currentSubtype}
                showSite={showSite}
              />
              {/* Toggle buttons (real, wired) */}
              <div
                className='flex rounded-full overflow-hidden border border-border/40 shadow-sm'
                style={{ fontSize: 10 }}
              >
                <button
                  onClick={() => setShowSite(false)}
                  className='px-3 py-1.5 transition-colors font-medium'
                  style={{
                    background: !showSite ? "#882040" : "transparent",
                    color: !showSite ? "#fdfbf7" : "#882040",
                  }}
                >
                  Ouverture
                </button>
                <button
                  onClick={() => setShowSite(true)}
                  className='px-3 py-1.5 transition-colors font-medium'
                  style={{
                    background: showSite ? "#882040" : "transparent",
                    color: showSite ? "#fdfbf7" : "#882040",
                  }}
                >
                  Invitation
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

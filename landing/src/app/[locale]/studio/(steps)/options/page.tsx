"use client";

import { Ban, Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@shared/lib/utils";
import { StepTransition } from "@/components/studio/StepTransition";
import { ALL_LANGUAGES, EXTRAS } from "@/components/studio/options";
import { LANGUAGE_PRICE, useOrderStore } from "@/stores/use-order-store";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-studio-violet/50">
      {children}
    </p>
  );
}

export default function StudioOptionsPage() {
  const t = useTranslations("StudioOptions");
  const {
    primaryLanguage,
    setPrimaryLanguage,
    languages,
    toggleLanguage,
    adultsOnly,
    setAdultsOnly,
    extras,
    toggleExtra,
  } = useOrderStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const primaryLang =
    ALL_LANGUAGES.find((l) => l.code === primaryLanguage) ?? ALL_LANGUAGES[0];
  const extraLanguages = ALL_LANGUAGES.filter((l) => l.code !== primaryLanguage);
  const languagesTotal = languages.length * LANGUAGE_PRICE;

  // Promoting a language to primary makes it free, so drop it from the paid list.
  function selectPrimary(code: string) {
    setPrimaryLanguage(code);
    if (languages.includes(code)) toggleLanguage(code);
    setDropdownOpen(false);
  }

  return (
    <StepTransition>
      <div className="flex flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-h2 leading-tight text-studio-violet">
            {t("titlePrefix")}
            <span className="text-studio-pourpre">{t("titleHighlight")}</span>
          </h1>
          <p className="mx-auto max-w-sm font-body text-sm text-studio-violet/60">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 md:grid md:grid-cols-2 md:items-start">
          {/* ── LANGUES ── */}
          <div className="flex flex-col gap-6">
            <div>
              <SectionLabel>{t("primaryLanguage")}</SectionLabel>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="studio-card-border studio-card-fill flex w-full items-center gap-3 rounded-2xl p-4"
                >
                  <span className="text-xl">{primaryLang.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="font-body text-sm font-semibold text-studio-violet">
                      {primaryLang.name}
                    </p>
                    <p className="font-body text-[10px] text-studio-violet/60">
                      {t("primaryIncluded")}
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-studio-violet/50 transition-transform duration-200",
                      dropdownOpen && "rotate-180",
                    )}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-studio-lavande/50 bg-white shadow-lg">
                    {ALL_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => selectPrimary(lang.code)}
                        className={cn(
                          "flex w-full items-center gap-3 border-b border-studio-lavande/30 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-studio-lavande/10",
                          lang.code === primaryLanguage && "bg-studio-lavande/20",
                        )}
                      >
                        <span className="text-xl">{lang.flag}</span>
                        <span className="font-body text-sm font-semibold text-studio-violet">
                          {lang.name}
                        </span>
                        {lang.code === primaryLanguage && (
                          <Check className="ml-auto h-4 w-4 text-studio-violet" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <SectionLabel>
                {t("extraLanguages", { price: LANGUAGE_PRICE })}
              </SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {extraLanguages.map((lang) => {
                  const isSelected = languages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={cn(
                        "studio-card-border studio-card-fill flex items-center gap-2.5 rounded-2xl p-3 text-left transition-shadow",
                        isSelected && "ring-2 ring-studio-violet",
                      )}
                    >
                      <span className="flex-shrink-0 text-xl">{lang.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-sm font-semibold text-studio-violet">
                          {lang.name}
                        </p>
                        <p className="font-body text-[10px] text-studio-violet/60">
                          +{LANGUAGE_PRICE}€
                        </p>
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-studio-violet-fonce">
                          <Check
                            className="h-3 w-3 text-white"
                            strokeWidth={1.75}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {languagesTotal > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-2xl bg-studio-lavande/20 px-4 py-3">
                  <span className="font-body text-sm text-studio-violet/70">
                    {t("languagesTotal", { count: languages.length })}
                  </span>
                  <span className="font-body text-sm font-bold text-studio-violet">
                    +{languagesTotal}€
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── EXTRAS + ADULTS ONLY ── */}
          <div className="flex flex-col gap-6">
            <div>
              <SectionLabel>{t("premiumOptions")}</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {EXTRAS.map((ex) => {
                  const isSelected = extras.includes(ex.id);
                  const Icon = ex.icon;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => toggleExtra(ex.id)}
                      className={cn(
                        "studio-card-border studio-card-fill relative flex flex-col gap-3 rounded-2xl p-4 text-left transition-shadow",
                        isSelected && "ring-2 ring-studio-violet",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-studio-violet-fonce">
                          <Check
                            className="h-3 w-3 text-white"
                            strokeWidth={1.75}
                          />
                        </div>
                      )}
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                          isSelected
                            ? "bg-studio-violet text-white"
                            : "bg-studio-lavande/20 text-studio-violet/60",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-body text-[12px] font-semibold leading-tight text-studio-violet">
                          {ex.name}
                        </p>
                        <p className="mt-1 line-clamp-2 font-body text-[10px] leading-relaxed text-studio-violet/60">
                          {ex.desc}
                        </p>
                      </div>
                      <p className="mt-auto font-body text-sm font-bold text-studio-violet">
                        +{ex.price}€
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>{t("preferences")}</SectionLabel>
              <button
                type="button"
                onClick={() => setAdultsOnly(!adultsOnly)}
                className={cn(
                  "studio-card-border studio-card-fill flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-shadow",
                  adultsOnly && "ring-2 ring-studio-violet",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors",
                    adultsOnly
                      ? "bg-studio-violet text-white"
                      : "bg-studio-lavande/20 text-studio-violet/60",
                  )}
                >
                  <Ban className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-body text-sm font-semibold text-studio-violet">
                    {t("adultsOnlyTitle")}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-studio-violet/60">
                    {t("adultsOnlyDesc")}
                  </p>
                </div>
                <div
                  className={cn(
                    "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200",
                    adultsOnly ? "bg-studio-violet" : "bg-studio-lavande/40",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-200",
                      adultsOnly ? "left-6" : "left-1",
                    )}
                  />
                </div>
              </button>

              {adultsOnly && (
                <p className="mt-3 rounded-2xl bg-studio-violet px-4 py-3.5 font-body text-xs italic leading-relaxed text-white">
                  &ldquo;{t("adultsOnlyQuote")}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </StepTransition>
  );
}

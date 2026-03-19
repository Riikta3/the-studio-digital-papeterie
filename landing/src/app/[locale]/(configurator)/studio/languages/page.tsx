"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { ChevronDown } from "lucide-react";

const LANGUAGE_PRICE = 15;

const ALL_LANGUAGES = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "Anglais" },
  { code: "es", flag: "🇪🇸", name: "Espagnol" },
  { code: "de", flag: "🇩🇪", name: "Allemand" },
  { code: "it", flag: "🇮🇹", name: "Italien" },
  { code: "pt", flag: "🇧🇷", name: "Portugais" },
  { code: "ar", flag: "🇸🇦", name: "Arabe" },
  { code: "zh", flag: "🇨🇳", name: "Chinois" },
  { code: "ja", flag: "🇯🇵", name: "Japonais" },
];

export default function LanguagesPage() {
  const { primaryLanguage, setPrimaryLanguage, languages, toggleLanguage } = useOrderStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const total = languages.length * LANGUAGE_PRICE;
  const primaryLang = ALL_LANGUAGES.find((l) => l.code === primaryLanguage) ?? ALL_LANGUAGES[0];
  const extraLanguages = ALL_LANGUAGES.filter((l) => l.code !== primaryLanguage);

  function selectPrimary(code: string) {
    setPrimaryLanguage(code);
    if (languages.includes(code)) toggleLanguage(code);
    setDropdownOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Langues de votre <span className="italic text-primary">site</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Langue principale incluse, +{LANGUAGE_PRICE}€ par langue supplémentaire.
        </p>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 flex flex-col gap-4">

        {/* Dropdown langue principale */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Langue principale — incluse
          </p>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/5 transition-all"
            >
              <span className="text-2xl">{primaryLang.flag}</span>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">{primaryLang.name}</p>
                <p className="text-[10px] text-primary font-sans">Langue principale · incluse</p>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", dropdownOpen && "rotate-180")} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                {ALL_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => selectPrimary(lang.code)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0",
                      lang.code === primaryLanguage && "bg-primary/5 text-primary",
                    )}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-bold">{lang.name}</span>
                    {lang.code === primaryLanguage && (
                      <span className="ml-auto text-[10px] font-bold text-primary font-sans">✓ Sélectionné</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grille 2 colonnes extras */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Langues supplémentaires — {LANGUAGE_PRICE}€ chacune
          </p>
          <div className="grid grid-cols-2 gap-2">
            {extraLanguages.map((lang) => {
              const isSelected = languages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all duration-150",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30",
                  )}
                >
                  <span className="text-xl flex-shrink-0">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{lang.name}</p>
                    <p className="text-[10px] text-muted-foreground font-sans">+{LANGUAGE_PRICE}€</p>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full border-2 border-primary/40 bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Total */}
        {languages.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/5 border border-primary/20">
            <span className="text-sm font-sans text-muted-foreground">
              {languages.length} langue{languages.length > 1 ? "s" : ""} supplémentaire{languages.length > 1 ? "s" : ""}
            </span>
            <span className="text-sm font-bold text-primary font-sans">+{total}€</span>
          </div>
        )}

      </div>
    </div>
  );
}

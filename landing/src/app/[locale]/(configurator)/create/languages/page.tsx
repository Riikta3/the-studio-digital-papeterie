"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";

const LANGUAGE_PRICE = 15;

const LANGUAGES = [
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
  const { languages, toggleLanguage } = useOrderStore();

  const total = languages.length * LANGUAGE_PRICE;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Langues de votre <span className="italic text-primary">site</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Le français est inclus. Ajoutez d&apos;autres langues à 15€ chacune.
        </p>
      </div>

      <div className="max-w-lg mx-auto w-full px-4 flex flex-col gap-3">
        {/* Included */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Langue incluse
          </p>
          <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-border bg-card">
            <span className="text-2xl">🇫🇷</span>
            <div className="flex-1">
              <p className="text-sm font-bold">Français</p>
              <p className="text-xs text-muted-foreground font-sans">Langue principale de votre site</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-sans">
              Inclus
            </span>
          </div>
        </div>

        {/* Additional languages */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
            Langues supplémentaires — 15€ chacune
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => {
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
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
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

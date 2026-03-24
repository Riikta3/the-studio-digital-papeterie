"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StepTransition } from "@/components/configurator/StepTransition";
import { useOrderStore } from "@/stores/use-order-store";
import { Ban, ChevronDown, Music, Palette, Video, Globe } from "lucide-react";

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

const EXTRAS = [
  { id: "custom-music", icon: Music, name: "Musique personnalisée", desc: "Ajoutez votre chanson préférée à l'ambiance de votre site.", price: 10 },
  { id: "custom-illustration", icon: Palette, name: "Illustration sur mesure", desc: "Un portrait illustré de vous deux réalisé par nos artistes.", price: 45 },
  { id: "animated-video", icon: Video, name: "Vidéo animée", desc: "Intro vidéo animée pour accueillir vos invités avec style.", price: 55 },
  { id: "custom-domain", icon: Globe, name: "Domaine personnalisé", desc: "sophie-et-pierre.fr au lieu du lien générique.", price: 65 },
];

export default function OptionsPage() {
  const { primaryLanguage, setPrimaryLanguage, languages, toggleLanguage, adultsOnly, setAdultsOnly, extras, toggleExtra } = useOrderStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const primaryLang = ALL_LANGUAGES.find((l) => l.code === primaryLanguage) ?? ALL_LANGUAGES[0];
  const extraLanguages = ALL_LANGUAGES.filter((l) => l.code !== primaryLanguage);
  const languagesTotal = languages.length * LANGUAGE_PRICE;

  function selectPrimary(code: string) {
    setPrimaryLanguage(code);
    if (languages.includes(code)) toggleLanguage(code);
    setDropdownOpen(false);
  }

  return (
    <StepTransition>
      <div className="flex flex-col gap-4">
        <div className="text-center space-y-2 px-4 pb-2">
          <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
            Options <span className="italic text-primary">& extras</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
            Tout est facultatif — personnalisez selon vos envies.
          </p>
        </div>

        <div className="flex flex-col gap-5 max-w-lg mx-auto w-full px-4">

          {/* ── LANGUES ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
              Langues du site
            </p>

            {/* Langue principale */}
            <div className="relative mb-2">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/5 transition-all"
              >
                <span className="text-xl">{primaryLang.flag}</span>
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
                        <span className="ml-auto text-[10px] font-bold text-primary font-sans">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Langues supplémentaires */}
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
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
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
            {languagesTotal > 0 && (
              <div className="flex items-center justify-between px-4 py-3 mt-2 rounded-2xl bg-primary/5 border border-primary/20">
                <span className="text-sm font-sans text-muted-foreground">
                  {languages.length} langue{languages.length > 1 ? "s" : ""} supplémentaire{languages.length > 1 ? "s" : ""}
                </span>
                <span className="text-sm font-bold text-primary font-sans">+{languagesTotal}€</span>
              </div>
            )}
          </div>

          {/* ── ADULTS ONLY ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
              Préférences
            </p>
            <button
              onClick={() => setAdultsOnly(!adultsOnly)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-left",
                adultsOnly ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors", adultsOnly ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                <Ban className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Mariage Adults Only</p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">Indique poliment que les enfants ne sont pas conviés.</p>
              </div>
              <div className={cn("w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200", adultsOnly ? "bg-primary" : "bg-muted")}>
                <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200", adultsOnly ? "left-6" : "left-1")} />
              </div>
            </button>
            {adultsOnly && (
              <p className="mt-2 px-4 py-3 rounded-xl bg-muted/40 text-xs text-muted-foreground font-sans italic leading-relaxed">
                &ldquo;Bien que nous adorions vos enfants, ce mariage sera une célébration entre adultes uniquement.&rdquo;
              </p>
            )}
          </div>

          {/* ── EXTRAS PREMIUM ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
              Options premium
            </p>
            <div className="grid grid-cols-2 gap-3">
              {EXTRAS.map((ex) => {
                const isSelected = extras.includes(ex.id);
                const Icon = ex.icon;
                return (
                  <button
                    key={ex.id}
                    onClick={() => toggleExtra(ex.id)}
                    className={cn(
                      "text-left p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all duration-150 relative",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/30",
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-colors", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold leading-tight">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground font-sans mt-1 line-clamp-2 leading-relaxed">{ex.desc}</p>
                    </div>
                    <p className="text-sm font-bold text-primary font-sans mt-auto">+{ex.price}€</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </StepTransition>
  );
}

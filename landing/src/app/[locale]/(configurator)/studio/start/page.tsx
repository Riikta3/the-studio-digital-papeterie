"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StepTransition } from "@/components/configurator/StepTransition";
import { useOrderStore } from "@/stores/use-order-store";
import { Eye, EyeOff, HeadphonesIcon, ShieldCheck, Sparkles } from "lucide-react";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1;
const CURRENT_DAY = TODAY.getDate();
const DEFAULT_YEAR = CURRENT_YEAR + 1;

function isDateInPast(day: string, month: string, year: string): boolean {
  const y = parseInt(year);
  const m = MONTHS.indexOf(month) + 1;
  const d = parseInt(day);
  if (!y || !m || !d) return false;
  if (y < CURRENT_YEAR) return true;
  if (y === CURRENT_YEAR && m < CURRENT_MONTH) return true;
  if (y === CURRENT_YEAR && m === CURRENT_MONTH && d < CURRENT_DAY) return true;
  return false;
}

export default function StartPage() {
  const { plan, setPlan, weddingInfo, setWeddingInfo, setEmailExists } = useOrderStore();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);

  const premiumSelected = plan === "premium";
  const essentialSelected = plan === "experience";

  const dateInPast = isDateInPast(weddingInfo.day, weddingInfo.month, weddingInfo.year);

  function handleDayChange(val: string) {
    const n = parseInt(val);
    if (val === "" || (n >= 1 && n <= 31))
      setWeddingInfo({ day: val === "" ? "" : String(n) });
  }

  function handleYearChange(val: string) {
    const n = parseInt(val);
    if (val === "" || n >= CURRENT_YEAR)
      setWeddingInfo({ year: val === "" ? "" : String(n) });
  }

  async function handleEmailBlur() {
    const email = weddingInfo.email.trim();
    if (!email || !email.includes("@")) return;
    setEmailChecking(true);
    setEmailError(null);
    setEmailExists(false);
    try {
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 409) {
        const data = await res.json();
        setEmailError(data.error);
        setEmailExists(true);
      }
    } catch {
      // silently ignore
    } finally {
      setEmailChecking(false);
    }
  }

  return (
    <StepTransition>
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="text-center space-y-2 px-4 pb-2">
          <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
            Créons votre site{" "}
            <span className="italic text-primary">ensemble</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
            Choisissez votre offre et renseignez les informations de votre mariage.
          </p>
        </div>

        <div className="flex flex-col gap-5 max-w-lg mx-auto w-full px-4">

          {/* ── SECTION 1 : OFFRE ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
              Votre offre
            </p>
            <div className="flex flex-col gap-2.5">

              {/* Premium */}
              <button
                onClick={() => setPlan("premium")}
                className={cn(
                  "relative w-full text-left rounded-2xl border-2 p-4 transition-all duration-200",
                  premiumSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="absolute -top-3 left-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary text-primary-foreground font-sans whitespace-nowrap">
                    Recommandé
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 mt-1">
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-0.5">Premium</p>
                    <p className="text-[11px] text-muted-foreground font-sans">Modules illimités · Domaine inclus · Support prioritaire</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-heading text-2xl font-bold text-primary">575€</span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      premiumSelected ? "border-primary bg-primary" : "border-border",
                    )}>
                      {premiumSelected && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {/* Essentiel */}
              <button
                onClick={() => setPlan("experience")}
                className={cn(
                  "w-full text-left rounded-2xl border-2 p-4 transition-all duration-200",
                  essentialSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-bold mb-0.5">Essentiel</p>
                    <p className="text-[11px] text-muted-foreground font-sans">4 modules inclus · Extras à la carte · Support standard</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-heading text-2xl font-bold text-primary">175€</span>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                      essentialSelected ? "border-primary bg-primary" : "border-border",
                    )}>
                      {essentialSelected && (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ── SECTION 2 : LES MARIÉS ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
              Les mariés
            </p>
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border/60">
                <div className="flex-1 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom 1</p>
                  <input
                    type="text"
                    placeholder="Sophie"
                    value={weddingInfo.partner1}
                    onChange={(e) => setWeddingInfo({ partner1: e.target.value })}
                    className="w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
                  />
                </div>
                <div className="flex-1 px-4 py-3 border-l border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Prénom 2</p>
                  <input
                    type="text"
                    placeholder="Pierre"
                    value={weddingInfo.partner2}
                    onChange={(e) => setWeddingInfo({ partner2: e.target.value })}
                    className="w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION 3 : DATE & LIEU ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
              Date & lieu
            </p>
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
              <div className="flex border-b border-border/60">
                <div className="w-[72px] px-4 py-3 border-r border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Jour</p>
                  <input
                    type="number"
                    placeholder="14"
                    min="1"
                    max="31"
                    value={weddingInfo.day}
                    onChange={(e) => handleDayChange(e.target.value)}
                    className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="flex-1 px-4 py-3 border-r border-border/60">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Mois</p>
                  <select
                    value={weddingInfo.month}
                    onChange={(e) => setWeddingInfo({ month: e.target.value })}
                    className="w-full text-sm font-sans bg-transparent outline-none text-foreground"
                  >
                    <option value="">—</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="w-[80px] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Année</p>
                  <input
                    type="number"
                    placeholder={String(DEFAULT_YEAR)}
                    min={CURRENT_YEAR}
                    value={weddingInfo.year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
              {dateInPast && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                  <p className="text-[11px] text-red-500 font-sans">La date doit être dans le futur.</p>
                </div>
              )}
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Lieu de la cérémonie</p>
                <input
                  type="text"
                  placeholder="Château des Roses, Provence"
                  value={weddingInfo.venue}
                  onChange={(e) => setWeddingInfo({ venue: e.target.value })}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic"
                />
              </div>
            </div>
          </div>

          {/* ── SECTION 4 : COMPTE ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2">
              Votre compte
            </p>
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Adresse email</p>
                <input
                  type="email"
                  placeholder="sophie@exemple.fr"
                  value={weddingInfo.email}
                  onChange={(e) => { setWeddingInfo({ email: e.target.value }); setEmailError(null); setEmailExists(false); }}
                  onBlur={handleEmailBlur}
                  className="w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                />
                {emailChecking && <p className="text-[10px] text-muted-foreground/50 font-sans mt-1">Vérification…</p>}
                {emailError && <p className="text-[10px] text-red-500 font-sans mt-1">{emailError}</p>}
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1">Mot de passe</p>
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={weddingInfo.password}
                    onChange={(e) => setWeddingInfo({ password: e.target.value })}
                    className="flex-1 text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground/50 font-sans mt-1">8 caractères minimum</p>
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className="flex gap-3">
            {[
              { label: "Personnalise votre site", icon: Sparkles },
              { label: "Accès sécurisé", icon: ShieldCheck },
              { label: "Support après achat", icon: HeadphonesIcon },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex-1 border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 text-center">
                <Icon className="w-4 h-4 text-primary/60" />
                <p className="text-[10px] text-muted-foreground/70 font-sans leading-tight">{label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </StepTransition>
  );
}

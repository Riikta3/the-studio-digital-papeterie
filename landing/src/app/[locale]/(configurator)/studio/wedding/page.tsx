"use client";

import { useState } from "react";
import { StepTransition } from "@/components/configurator/StepTransition";
import { useOrderStore } from "@/stores/use-order-store";
import { HeadphonesIcon, ShieldCheck, Sparkles, Eye, EyeOff } from "lucide-react";

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1; // 1-based
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

export default function WeddingPage() {
  const { weddingInfo, setWeddingInfo, setEmailExists } = useOrderStore();
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);

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
      // silently ignore network errors
    } finally {
      setEmailChecking(false);
    }
  }

  const dateInPast = isDateInPast(
    weddingInfo.day,
    weddingInfo.month,
    weddingInfo.year,
  );

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

  return (
    <StepTransition>
      <div className='flex flex-col gap-5'>
        <div className='text-center space-y-2 px-4 pb-2'>
          <h1 className='font-heading text-3xl font-bold md:text-4xl lg:text-5xl'>
            Parlez-nous de votre{" "}
            <span className='italic text-primary'>mariage</span>
          </h1>
          <p className='text-muted-foreground text-sm max-w-sm mx-auto font-sans'>
            Ces informations personnaliseront votre site d&apos;invitation.
          </p>
        </div>

        <div className='flex flex-col gap-4 max-w-lg mx-auto w-full px-4'>
          {/* Partners */}
          <div>
            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2'>
              Les mariés
            </p>
            <div className='bg-card border-2 border-border rounded-2xl overflow-hidden'>
              <div className='flex border-b border-border/60'>
                <div className='flex-1 px-4 py-3'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                    Prénom marié·e 1
                  </p>
                  <input
                    type='text'
                    placeholder='Sophie'
                    value={weddingInfo.partner1}
                    onChange={(e) =>
                      setWeddingInfo({ partner1: e.target.value })
                    }
                    className='w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic'
                  />
                </div>
                <div className='flex-1 px-4 py-3 border-l border-border/60'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                    Prénom marié·e 2
                  </p>
                  <input
                    type='text'
                    placeholder='Pierre'
                    value={weddingInfo.partner2}
                    onChange={(e) =>
                      setWeddingInfo({ partner2: e.target.value })
                    }
                    className='w-full text-sm font-heading bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2'>
              Date & lieu
            </p>
            <div className='bg-card border-2 border-border rounded-2xl overflow-hidden'>
              <div className='flex border-b border-border/60'>
                <div className='w-[72px] px-4 py-3 border-r border-border/60'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                    Jour
                  </p>
                  <input
                    type='number'
                    placeholder='14'
                    min='1'
                    max='31'
                    value={weddingInfo.day}
                    onChange={(e) => handleDayChange(e.target.value)}
                    className='w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40'
                  />
                </div>
                <div className='flex-1 px-4 py-3 border-r border-border/60'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                    Mois
                  </p>
                  <select
                    value={weddingInfo.month}
                    onChange={(e) => setWeddingInfo({ month: e.target.value })}
                    className='w-full text-sm font-sans bg-transparent outline-none text-foreground'
                  >
                    <option value=''>—</option>
                    {MONTHS.map((m) => (
                      <option
                        key={m}
                        value={m}
                      >
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='w-[80px] px-4 py-3'>
                  <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                    Année
                  </p>
                  <input
                    type='number'
                    placeholder={String(DEFAULT_YEAR)}
                    min={CURRENT_YEAR}
                    value={weddingInfo.year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className='w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40'
                  />
                </div>
              </div>
              {dateInPast && (
                <div className='px-4 py-2 bg-red-50 border-t border-red-100'>
                  <p className='text-[11px] text-red-500 font-sans'>
                    La date doit être dans le futur.
                  </p>
                </div>
              )}
              <div className='px-4 py-3'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                  Lieu de la cérémonie
                </p>
                <input
                  type='text'
                  placeholder='Château des Roses, Provence'
                  value={weddingInfo.venue}
                  onChange={(e) => setWeddingInfo({ venue: e.target.value })}
                  className='w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40 placeholder:italic'
                />
              </div>
            </div>
          </div>

          {/* Account */}
          <div>
            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-2'>
              Le coin des mariés
            </p>
            <div className='bg-card border-2 border-border rounded-2xl overflow-hidden'>
              <div className='px-4 py-3 border-b border-border/60'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                  Adresse email
                </p>
                <input
                  type='email'
                  placeholder='sophie@exemple.fr'
                  value={weddingInfo.email}
                  onChange={(e) => { setWeddingInfo({ email: e.target.value }); setEmailError(null); setEmailExists(false); }}
                  onBlur={handleEmailBlur}
                  className='w-full text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40'
                />
                {emailChecking && (
                  <p className='text-[10px] text-muted-foreground/50 font-sans mt-1'>Vérification…</p>
                )}
                {emailError && (
                  <p className='text-[10px] text-red-500 font-sans mt-1'>{emailError}</p>
                )}
              </div>
              <div className='px-4 py-3'>
                <p className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 font-sans mb-1'>
                  Mot de passe
                </p>
                <div className='flex items-center gap-2'>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='••••••••'
                    value={weddingInfo.password}
                    onChange={(e) => setWeddingInfo({ password: e.target.value })}
                    className='flex-1 text-sm font-sans bg-transparent outline-none placeholder:text-muted-foreground/40'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword((v) => !v)}
                    className='text-muted-foreground/40 hover:text-muted-foreground transition-colors flex-shrink-0'
                  >
                    {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                  </button>
                </div>
                <p className='text-[10px] text-muted-foreground/50 font-sans mt-1'>
                  8 caractères minimum
                </p>
              </div>
            </div>
          </div>

          {/* Trust row */}
          <div className='flex gap-3 pt-1'>
            {[
              { label: "Personnalise votre site", icon: Sparkles },
              { label: "Accès sécurisé", icon: ShieldCheck },
              { label: "Support après achat", icon: HeadphonesIcon },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className='flex-1 border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 text-center'
              >
                <Icon className='w-4 h-4 text-primary/60' />
                <p className='text-[10px] text-muted-foreground/70 font-sans leading-tight'>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </StepTransition>
  );
}

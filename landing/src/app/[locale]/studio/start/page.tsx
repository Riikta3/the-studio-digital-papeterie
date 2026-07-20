"use client";

import { ArrowRight, HeadphonesIcon, ShieldCheck, Sparkles, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { useOrderStore, selectTotalPrice } from "@/stores/use-order-store";
import { useRouter } from "@/navigation";
import { MobileMenu } from "@/components/home/MobileMenu";

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1;
const CURRENT_DAY = TODAY.getDate();
const DEFAULT_YEAR = CURRENT_YEAR + 1;

function isDateInPast(day: string, monthIndex: number, year: string): boolean {
  const y = parseInt(year);
  const d = parseInt(day);
  if (!y || !monthIndex || !d) return false;
  if (y < CURRENT_YEAR) return true;
  if (y === CURRENT_YEAR && monthIndex < CURRENT_MONTH) return true;
  if (y === CURRENT_YEAR && monthIndex === CURRENT_MONTH && d < CURRENT_DAY)
    return true;
  return false;
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-studio-violet" : "border-studio-lavande/50",
      )}
    >
      {selected && <div className="h-2.5 w-2.5 rounded-full bg-studio-violet" />}
    </div>
  );
}

export default function StudioStartPage() {
  const t = useTranslations("StudioStart");
  const months = t.raw("months") as string[];
  const premiumFeatures = t.raw("premiumFeatures") as string[];
  const essentialFeatures = t.raw("essentialFeatures") as string[];

  const router = useRouter();
  const { plan, setPlan, weddingInfo, setWeddingInfo, setEmailExists, emailExists } =
    useOrderStore();
  const totalPrice = useOrderStore(selectTotalPrice);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Premium is the recommended plan and pre-selected, matching the mockup.
  useEffect(() => {
    if (!plan) setPlan("premium");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const email = weddingInfo.email.trim();
    if (!email || !email.includes("@")) return;
    setEmailChecking(true);
    setEmailError(null);
    setEmailExists(false);
    fetch("/api/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((res) => {
        if (res.status === 409) {
          return res.json().then((data) => {
            setEmailError(data.error);
            setEmailExists(true);
          });
        }
      })
      .catch(() => {})
      .finally(() => setEmailChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const premiumSelected = plan === "premium";
  const essentialSelected = plan === "experience";
  const monthIndex = months.indexOf(weddingInfo.month) + 1;
  const dateInPast = isDateInPast(weddingInfo.day, monthIndex, weddingInfo.year);

  const isFormValid =
    !!plan &&
    !!weddingInfo.partner1.trim() &&
    !!weddingInfo.partner2.trim() &&
    !!weddingInfo.day &&
    !!weddingInfo.month &&
    !!weddingInfo.year &&
    !dateInPast &&
    !!weddingInfo.venue.trim() &&
    !!weddingInfo.email.trim() &&
    !emailExists;

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
    <div className="min-h-screen bg-studio-violet">
      <div className="min-h-screen bg-studio-beurre pb-32">
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 pb-16 pt-8 md:max-w-3xl">
        <nav className="flex w-full items-center justify-between rounded-full bg-white px-4 py-2 shadow-sm">
          <Image src="/logo-violet.svg" alt="The Studio Digital Papeterie" width={36} height={38} />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menuAriaLabel")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} hideCreateButton />

        <div className="mt-8 max-w-sm space-y-2 text-center">
          <h1 className="font-heading text-h2 text-studio-violet">
            {t("titlePrefix")} <span className="italic text-studio-pourpre">{t("titleHighlight")}</span>
          </h1>
          <p className="font-body text-sm text-studio-violet/60">{t("subtitle")}</p>
        </div>

        <div className="mt-8 w-full space-y-8 md:grid md:grid-cols-2 md:items-start md:gap-10 md:space-y-0">
          {/* ── COL GAUCHE : OFFRES + TRUST ── */}
          <div className="flex flex-col gap-4">
            {/* Single enclosing card, matches Figma mockup */}
            <div className="rounded-2xl border border-studio-lavande/50 bg-white p-4">
              <p className="mb-3 font-heading text-h4 text-studio-violet">
                {t("offerLabel")}
              </p>
              <div className="flex flex-col gap-3">
                {/* Premium */}
                <button
                  type="button"
                  onClick={() => setPlan("premium")}
                  className={cn(
                    "relative w-full rounded-xl p-4 text-left transition-all duration-200",
                    premiumSelected
                      ? "bg-studio-lavande/20 shadow-sm"
                      : "bg-transparent hover:bg-studio-lavande/10",
                  )}
                >
                  <div className="absolute -top-3 left-4">
                    <span className="whitespace-nowrap rounded-full bg-studio-violet px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-white">
                      {t("recommended")}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="mb-0.5 font-heading text-sm font-bold text-studio-violet">
                        {t("premiumTitle")}
                      </p>
                      <ul className="mt-2 flex flex-col gap-0.5">
                        {premiumFeatures.map((f, i) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <span className="mt-1 flex-shrink-0 text-studio-violet/50">·</span>
                            <span
                              className={cn(
                                "font-body text-[11px] leading-tight",
                                i === premiumFeatures.length - 1
                                  ? "font-bold text-studio-violet"
                                  : "text-studio-violet/60",
                              )}
                            >
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="font-heading text-2xl font-bold text-studio-violet">
                        575€
                      </span>
                      <RadioDot selected={premiumSelected} />
                    </div>
                  </div>
                </button>

                {/* Essentiel */}
                <button
                  type="button"
                  onClick={() => setPlan("experience")}
                  className={cn(
                    "w-full rounded-xl p-4 text-left transition-all duration-200",
                    essentialSelected
                      ? "bg-studio-lavande/20 shadow-sm"
                      : "bg-transparent hover:bg-studio-lavande/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="mb-0.5 font-heading text-sm font-bold text-studio-violet">
                        {t("essentialTitle")}
                      </p>
                      <ul className="mt-2 flex flex-col gap-0.5">
                        {essentialFeatures.map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <span className="mt-1 flex-shrink-0 text-studio-violet/40">·</span>
                            <span className="font-body text-[11px] leading-tight text-studio-violet/60">
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="font-heading text-2xl font-bold text-studio-violet">
                        175€
                      </span>
                      <RadioDot selected={essentialSelected} />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Trust row */}
            <div className="flex gap-3">
              {[
                { label: t("trustCustomize"), icon: Sparkles },
                { label: t("trustSecure"), icon: ShieldCheck },
                { label: t("trustSupport"), icon: HeadphonesIcon },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-studio-jaune/40 p-3 text-center"
                >
                  <Icon className="h-4 w-4 text-studio-violet/60" />
                  <p className="font-body text-[10px] leading-tight text-studio-violet/70">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── COL DROITE : FORMULAIRE ── */}
          <div className="flex flex-col gap-6">
            {/* Les mariés */}
            <div>
              <p className="mb-2 font-heading text-sm font-bold text-studio-violet">
                {t("coupleLabel")}
              </p>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="flex divide-x divide-studio-lavande/20">
                  <div className="flex-1 px-4 py-3">
                    <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                      {t("partner1Label")}
                    </p>
                    <input
                      type="text"
                      placeholder={t("partner1Placeholder")}
                      value={weddingInfo.partner1}
                      onChange={(e) => setWeddingInfo({ partner1: e.target.value })}
                      className="w-full bg-transparent font-body text-sm text-studio-violet outline-none placeholder:italic placeholder:text-studio-violet/30"
                    />
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                      {t("partner2Label")}
                    </p>
                    <input
                      type="text"
                      placeholder={t("partner2Placeholder")}
                      value={weddingInfo.partner2}
                      onChange={(e) => setWeddingInfo({ partner2: e.target.value })}
                      className="w-full bg-transparent font-body text-sm text-studio-violet outline-none placeholder:italic placeholder:text-studio-violet/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Date & lieu */}
            <div>
              <p className="mb-2 font-heading text-sm font-bold text-studio-violet">
                {t("dateLocationLabel")}
              </p>
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="flex divide-x divide-studio-lavande/20">
                  <div className="w-[64px] px-4 py-3">
                    <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                      {t("dayLabel")}
                    </p>
                    <input
                      type="number"
                      placeholder="14"
                      min="1"
                      max="31"
                      value={weddingInfo.day}
                      onChange={(e) => handleDayChange(e.target.value)}
                      className="w-full bg-transparent font-body text-sm text-studio-violet outline-none placeholder:text-studio-violet/30"
                    />
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                      {t("monthLabel")}
                    </p>
                    <select
                      value={weddingInfo.month}
                      onChange={(e) => setWeddingInfo({ month: e.target.value })}
                      className="w-full bg-transparent font-body text-sm text-studio-violet outline-none"
                    >
                      <option value="">—</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-[76px] px-4 py-3">
                    <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                      {t("yearLabel")}
                    </p>
                    <input
                      type="number"
                      placeholder={String(DEFAULT_YEAR)}
                      min={CURRENT_YEAR}
                      value={weddingInfo.year}
                      onChange={(e) => handleYearChange(e.target.value)}
                      className="w-full bg-transparent font-body text-sm text-studio-violet outline-none placeholder:text-studio-violet/30"
                    />
                  </div>
                </div>
                {dateInPast && (
                  <div className="border-t border-red-100 bg-red-50 px-4 py-2">
                    <p className="font-body text-[11px] text-red-500">
                      {t("dateInPastError")}
                    </p>
                  </div>
                )}
                <div className="border-t border-studio-lavande/20 px-4 py-3">
                  <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                    {t("venueLabel")}
                  </p>
                  <input
                    type="text"
                    placeholder={t("venuePlaceholder")}
                    value={weddingInfo.venue}
                    onChange={(e) => setWeddingInfo({ venue: e.target.value })}
                    className="w-full bg-transparent font-body text-sm text-studio-violet outline-none placeholder:italic placeholder:text-studio-violet/30"
                  />
                </div>
              </div>
            </div>

            {/* Compte */}
            <div>
              <p className="mb-2 font-heading text-sm font-bold text-studio-violet">
                {t("accountLabel")}
              </p>
              <div className="overflow-hidden rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-studio-violet/50">
                  {t("emailLabel")}
                </p>
                <input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={weddingInfo.email}
                  onChange={(e) => {
                    setWeddingInfo({ email: e.target.value });
                    setEmailError(null);
                    setEmailExists(false);
                  }}
                  onBlur={handleEmailBlur}
                  className="w-full bg-transparent font-body text-sm text-studio-violet outline-none placeholder:text-studio-violet/30"
                />
                {emailChecking && (
                  <p className="mt-1 font-body text-[10px] text-studio-violet/40">
                    {t("emailChecking")}
                  </p>
                )}
                {emailError && (
                  <p className="mt-1 font-body text-[10px] text-red-500">{emailError}</p>
                )}
              </div>
              <p className="mt-2 font-body text-[11px] text-studio-violet/40">
                {t("privacyHint")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 bg-studio-beurre/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-end">
          <Button
            variant="studio-violet"
            size="pill"
            disabled={!isFormValid}
            onClick={() => router.push("/studio/animation")}
          >
            {totalPrice}€ - {t("submitButton")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}

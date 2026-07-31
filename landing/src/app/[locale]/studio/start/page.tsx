"use client";

import { ArrowRight, Check, HeadphonesIcon, ShieldCheck, Sparkles, Menu } from "lucide-react";
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

const PREMIUM_PRICE = 575;
const ESSENTIAL_PRICE = 175;

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

/** Field label sitting above its input, as in the mockup. */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-studio-violet/70">
      {children}
    </p>
  );
}

const FIELD_CLASS =
  "h-12 w-full rounded-xl border border-studio-lavande/40 bg-studio-card-bg px-4 font-body text-sm text-studio-violet outline-none transition-colors placeholder:text-studio-violet/35 focus:border-studio-violet/50";

/** Selection indicator: filled violet check when active, hollow ring otherwise. */
function SelectDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
        selected
          ? "border-studio-lavande bg-studio-violet-fonce"
          : "border-studio-lavande/60 bg-white",
      )}
    >
      {selected && <Check className="h-4 w-4 text-white" strokeWidth={1.75} />}
    </div>
  );
}

export default function StudioStartPage() {
  const t = useTranslations("StudioStart");
  const months = t.raw("months") as string[];
  const premiumFeatures = t.raw("premiumFeatures") as string[];
  const essentialFeatures = t.raw("essentialFeatures") as string[];

  const router = useRouter();
  const {
    plan,
    setPlan,
    weddingInfo,
    setWeddingInfo,
    setEmailExists,
    emailExists,
    _hasHydrated,
  } = useOrderStore();
  const totalPrice = useOrderStore(selectTotalPrice);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Premium is the recommended plan and pre-selected, matching the mockup.
  // Wait for the persisted store to rehydrate so we don't overwrite a
  // previously chosen plan.
  useEffect(() => {
    if (_hasHydrated && !plan) setPlan("premium");
  }, [_hasHydrated, plan, setPlan]);

  async function checkEmail(email: string) {
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

  // Re-validate an email restored from a previous session, once hydrated.
  useEffect(() => {
    if (!_hasHydrated) return;
    checkEmail(weddingInfo.email.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

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

  return (
    <div className="min-h-screen bg-studio-beurre">
      <div className="mx-auto flex w-full flex-col px-5 pb-16 pt-6 md:max-w-3xl">
        <nav className="flex w-full items-center justify-between rounded-full bg-white px-5 py-3 shadow-[0_2px_12px_rgba(75,63,114,0.06)]">
          <Image
            src="/logo-violet.svg"
            alt="The Studio Digital Papeterie"
            width={40}
            height={42}
          />
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

        <div className="mt-10 space-y-3 text-center">
          <h1 className="font-heading text-h2 leading-tight text-studio-violet">
            {t("titlePrefix")}{" "}
            <span className="text-studio-pourpre">{t("titleHighlight")}</span>
          </h1>
          <p className="mx-auto max-w-xs font-body text-sm leading-relaxed text-studio-violet/60">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-8 md:grid md:grid-cols-2 md:items-start md:gap-8">
          {/* ── OFFRES + TRUST ── */}
          <div className="flex flex-col gap-8">
            <section className="studio-card-border studio-card-fill relative rounded-3xl p-5">
              <h2 className="mb-4 font-heading text-lg font-bold text-studio-violet">
                {t("offerLabel")}
              </h2>

              <div className="flex flex-col gap-6">
                {/* Premium — the "recommended" pill straddles the card's top edge */}
                <button
                  type="button"
                  onClick={() => setPlan("premium")}
                  className={cn(
                    "studio-card-border relative mt-3 w-full rounded-2xl p-4 pt-6 text-left transition-colors duration-200",
                    premiumSelected
                      ? "bg-studio-card-selected"
                      : "bg-white hover:bg-studio-card-selected/60",
                  )}
                >
                  <span className="absolute -top-3 left-3 z-10 inline-block rounded-full bg-studio-violet-clair px-4 py-1.5 font-body text-[11px] uppercase tracking-[0.14em] text-white">
                    {t("recommended")}
                  </span>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="mb-2 font-body text-base font-semibold text-studio-violet">
                        {t("premiumTitle")}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {premiumFeatures.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <span className="mt-0.5 flex-shrink-0 text-studio-violet/40">
                              ·
                            </span>
                            <span className="font-body text-[13px] leading-snug text-studio-violet/75">
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2.5">
                      <span className="font-heading text-2xl text-studio-violet">
                        {PREMIUM_PRICE}€
                      </span>
                      <SelectDot selected={premiumSelected} />
                    </div>
                  </div>
                </button>

                {/* Essentiel */}
                <button
                  type="button"
                  onClick={() => setPlan("experience")}
                  className={cn(
                    "studio-card-border relative w-full rounded-2xl p-4 text-left transition-colors duration-200",
                    essentialSelected
                      ? "bg-studio-card-selected"
                      : "bg-white hover:bg-studio-card-selected/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="mb-2 font-body text-base font-semibold text-studio-violet">
                        {t("essentialTitle")}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {essentialFeatures.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <span className="mt-0.5 flex-shrink-0 text-studio-violet/40">
                              ·
                            </span>
                            <span className="font-body text-[13px] leading-snug text-studio-violet/75">
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2.5">
                      <span className="font-heading text-2xl text-studio-violet">
                        {ESSENTIAL_PRICE}€
                      </span>
                      <SelectDot selected={essentialSelected} />
                    </div>
                  </div>
                </button>
              </div>
            </section>

            {/* Trust row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t("trustCustomize"), icon: Sparkles },
                { label: t("trustSecure"), icon: ShieldCheck },
                { label: t("trustSupport"), icon: HeadphonesIcon },
              ].map(({ label, icon: Icon }) => (
                <div
                  key={label}
                  className="studio-card-border studio-card-fill relative flex flex-col items-center justify-center gap-2.5 rounded-2xl p-4 text-center"
                >
                  <Icon className="h-5 w-5 flex-shrink-0 text-studio-violet" />
                  <p className="font-body text-[11px] leading-snug text-studio-violet/75">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── FORMULAIRE ── */}
          <section className="studio-card-border studio-card-fill relative flex flex-col rounded-3xl p-5">
            <h2 className="mb-4 font-heading text-lg font-bold text-studio-violet">
              {t("coupleLabel")}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>{t("partner1Label")}</FieldLabel>
                <input
                  type="text"
                  placeholder={t("partner1Placeholder")}
                  value={weddingInfo.partner1}
                  onChange={(e) => setWeddingInfo({ partner1: e.target.value })}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <FieldLabel>{t("partner2Label")}</FieldLabel>
                <input
                  type="text"
                  placeholder={t("partner2Placeholder")}
                  value={weddingInfo.partner2}
                  onChange={(e) => setWeddingInfo({ partner2: e.target.value })}
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <h3 className="mb-3 mt-6 font-body text-[13px] font-bold uppercase tracking-[0.08em] text-studio-violet">
              {t("dateLocationLabel")}
            </h3>

            <div className="grid grid-cols-[1fr_1.6fr_1fr] gap-3">
              <div>
                <FieldLabel>{t("dayLabel")}</FieldLabel>
                <input
                  type="number"
                  placeholder="14"
                  min="1"
                  max="31"
                  value={weddingInfo.day}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
              <div>
                <FieldLabel>{t("monthLabel")}</FieldLabel>
                <select
                  value={weddingInfo.month}
                  onChange={(e) => setWeddingInfo({ month: e.target.value })}
                  className={cn(
                    FIELD_CLASS,
                    // appearance-none makes some browsers fall back to a white
                    // control background, so re-assert the field color here.
                    "cursor-pointer appearance-none !bg-studio-card-bg bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234B3F72%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:16px_16px] bg-[right_0.9rem_center] bg-no-repeat pr-10",
                    !weddingInfo.month && "text-studio-violet/35",
                  )}
                >
                  <option value="">—</option>
                  {months.map((m) => (
                    <option key={m} value={m} className="text-studio-violet">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>{t("yearLabel")}</FieldLabel>
                <input
                  type="number"
                  placeholder={String(DEFAULT_YEAR)}
                  min={CURRENT_YEAR}
                  value={weddingInfo.year}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            {dateInPast && (
              <p className="mt-2 font-body text-[12px] text-red-500">
                {t("dateInPastError")}
              </p>
            )}

            <div className="mt-4">
              <FieldLabel>{t("venueLabel")}</FieldLabel>
              <input
                type="text"
                placeholder={t("venuePlaceholder")}
                value={weddingInfo.venue}
                onChange={(e) => setWeddingInfo({ venue: e.target.value })}
                className={FIELD_CLASS}
              />
            </div>

            <h3 className="mb-3 mt-6 font-body text-[13px] font-bold uppercase tracking-[0.08em] text-studio-violet">
              {t("accountLabel")}
            </h3>

            <FieldLabel>{t("emailLabel")}</FieldLabel>
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={weddingInfo.email}
              onChange={(e) => {
                setWeddingInfo({ email: e.target.value });
                setEmailError(null);
                setEmailExists(false);
              }}
              onBlur={(e) => checkEmail(e.target.value.trim())}
              className={FIELD_CLASS}
            />
            {emailChecking && (
              <p className="mt-1.5 font-body text-[12px] text-studio-violet/40">
                {t("emailChecking")}
              </p>
            )}
            {emailError && (
              <p className="mt-1.5 font-body text-[12px] text-red-500">{emailError}</p>
            )}

            <p className="mt-3 font-body text-[12px] text-studio-violet/45">
              {t("privacyHint")}
            </p>

            <Button
              variant="studio-violet"
              size="pill"
              disabled={!isFormValid}
              onClick={() => router.push("/studio/animation")}
              className="mt-6 w-full"
            >
              {totalPrice}€ - {t("submitButton")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}

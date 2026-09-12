"use client";

import {
  ArrowRight,
  Check,
  HeadphonesIcon,
  ShieldCheck,
  Sparkles,
  Menu,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { PLAN_PRICES } from "@/lib/pricing";
import {
  useOrderStore,
  selectTotalPrice,
  type PlanType,
} from "@/stores/use-order-store";
import { useRouter } from "@/navigation";
import { useSearchParams } from "next/navigation";
import { MobileMenu } from "@/components/home/MobileMenu";

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const CURRENT_MONTH = TODAY.getMonth() + 1;
const CURRENT_DAY = TODAY.getDate();
const DEFAULT_YEAR = CURRENT_YEAR + 1;

// Matches HIGHLIGHTED_PLAN_ID in the homepage's Pricing section, so the same
// offer is flagged in both places.
const RECOMMENDED_PLAN_ID = "sur-mesure";

type PricingPlan = {
  id: PlanType & string;
  name: string;
  positioning?: string;
  description?: string;
  features?: string[];
};

function isDateInPast(day: string, monthIndex: number, year: string): boolean {
  const y = parseInt(year);
  const d = parseInt(day);
  if (!y || !monthIndex || !d) return false;
  // Half-typed years are not "in the past", they are unfinished: "202" on the
  // way to "2027" would otherwise flash the error under the field while the
  // couple is still typing.
  if (year.trim().length < 4) return false;
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
  // The offer cards are driven by the same catalogue the homepage renders, so
  // the two can no longer show different names, prices or a different count.
  const plans = useTranslations("Pricing").raw("plans") as PricingPlan[];
  const searchParams = useSearchParams();

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

  // Preselect from `?plan=` — the pricing cards on the homepage link here with
  // it, and it used to be ignored entirely, so clicking "Choisir Signature"
  // landed on a page with a different offer already ticked. Falls back to the
  // recommended plan. Waits for rehydration so a previously chosen plan is not
  // overwritten.
  useEffect(() => {
    if (!_hasHydrated || plan) return;
    const requested = searchParams.get("plan");
    const valid = plans.some((p) => p.id === requested);
    setPlan((valid ? requested : RECOMMENDED_PLAN_ID) as PlanType);
  }, [_hasHydrated, plan, setPlan, searchParams, plans]);

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

  const monthIndex = months.indexOf(weddingInfo.month) + 1;
  const dateInPast = isDateInPast(
    weddingInfo.day,
    monthIndex,
    weddingInfo.year,
  );

  const isFormValid =
    !!plan &&
    !!weddingInfo.partner1.trim() &&
    !!weddingInfo.partner2.trim() &&
    !!weddingInfo.day &&
    !!weddingInfo.month &&
    // Four digits, not merely non-empty: the field accepts the year as it is
    // typed, so "202" is a valid keystroke but not a valid answer.
    weddingInfo.year.trim().length === 4 &&
    !dateInPast &&
    !!weddingInfo.venue.trim() &&
    !!weddingInfo.email.trim() &&
    !emailExists;

  function handleDayChange(val: string) {
    const n = parseInt(val);
    if (val === "" || (n >= 1 && n <= 31))
      setWeddingInfo({ day: val === "" ? "" : String(n) });
  }

  /**
   * Accepts the year as it is typed, digit by digit.
   *
   * This used to reject anything below CURRENT_YEAR on every keystroke, which
   * made the field impossible to fill: typing "2027" goes through "2", "20"
   * and "202", each of which parses to a number far below 2026 and was thrown
   * away, so the input never got past its first character. The placeholder
   * showing a greyed-out "2027" made it look like a value was already there.
   *
   * Only the shape is enforced here — digits, at most four. Whether the date
   * is in the past is answered by `dateInPast` once the three fields are
   * filled, which is the right place for it: it needs the day and month too,
   * and it can explain itself instead of silently swallowing a keystroke.
   */
  function handleYearChange(val: string) {
    if (val === "") {
      setWeddingInfo({ year: "" });
      return;
    }

    if (!/^\d{1,4}$/.test(val)) return;

    setWeddingInfo({ year: val });
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

        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          hideCreateButton
        />

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
          {/* ── OFFRES ── */}
          <div className="flex flex-col gap-8">
            <section className="studio-card-border studio-card-fill relative rounded-3xl p-5">
              <h2 className="mb-4 font-heading text-lg font-bold text-studio-violet">
                {t("offerLabel")}
              </h2>

              <div className="flex flex-col gap-6">
                {plans.map((offer) => {
                  const selected = plan === offer.id;
                  const isRecommended = offer.id === RECOMMENDED_PLAN_ID;
                  return (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => setPlan(offer.id)}
                      className={cn(
                        "studio-card-border relative w-full rounded-2xl p-4 text-left transition-colors duration-200",
                        // The "recommended" pill straddles the card's top edge,
                        // so that card needs room above it and inside it.
                        isRecommended && "mt-3 pt-6",
                        selected
                          ? "bg-studio-card-selected"
                          : "bg-white hover:bg-studio-card-selected/60",
                      )}
                    >
                      {isRecommended && (
                        <span className="absolute -top-3 left-3 z-10 inline-block rounded-full bg-studio-violet-clair px-4 py-1.5 font-body text-[11px] uppercase tracking-[0.14em] text-white">
                          {t("recommended")}
                        </span>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="mb-2 font-body text-base font-semibold text-studio-violet">
                            {offer.name}
                          </p>
                          {/* Features exist only on the top tier; the others
                              carry a positioning sentence instead. Both are
                              already translated for the homepage. */}
                          {offer.features?.length ? (
                            <ul className="flex flex-col gap-1">
                              {offer.features.map((f) => (
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
                          ) : (
                            <p className="font-body text-[13px] leading-snug text-studio-violet/75">
                              {offer.positioning || offer.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2.5">
                          <span className="font-heading text-2xl text-studio-violet">
                            {PLAN_PRICES[offer.id]}€
                          </span>
                          <SelectDot selected={selected} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── FORMULAIRE + RÉASSURANCE ── */}
          <div className="flex flex-col gap-8">
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
                    onChange={(e) =>
                      setWeddingInfo({ partner1: e.target.value })
                    }
                    className={FIELD_CLASS}
                  />
                </div>
                <div>
                  <FieldLabel>{t("partner2Label")}</FieldLabel>
                  <input
                    type="text"
                    placeholder={t("partner2Placeholder")}
                    value={weddingInfo.partner2}
                    onChange={(e) =>
                      setWeddingInfo({ partner2: e.target.value })
                    }
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
                <p className="mt-1.5 font-body text-[12px] text-red-500">
                  {emailError}
                </p>
              )}

              <p className="mt-3 font-body text-[12px] text-studio-violet/45">
                {t("privacyHint")}
              </p>

              <Button
                variant="studio-violet"
                size="pill"
                disabled={!isFormValid}
                onClick={() => router.push("/studio/theme")}
                className="mt-6 w-full"
              >
                {totalPrice}€ - {t("submitButton")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </section>

            {/* Reassurance sits under the form, next to the fields it is
                reassuring about — the account and the personal details —
                rather than under the offer cards. */}
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
        </div>
      </div>
    </div>
  );
}

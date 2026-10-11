"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { isValidLabel, normalizeLabel, suggestLabels, toDomainName } from "@shared/lib/custom-domain";
import { useOrderStore } from "@/stores/use-order-store";

/**
 * `?domain=edit` on the options step: the checkout's « Modifier mon nom de
 * domaine » sends the couple here, to the field, with the panel open.
 */
export const EDIT_DOMAIN_QUERY = { domain: "edit" } as const;

/** Waits this long after the last keystroke before asking the server. */
const CHECK_DEBOUNCE_MS = 400;
/** The DNS limit for one label; the field still accepts a little more, to be normalised. */
const MAX_LABEL_LENGTH = 63;
const EASE = [0.22, 1, 0.36, 1] as const;

/** One answer of `/api/custom-domains/check` for a label. */
interface CheckResult {
  available: boolean;
  reason: string | null;
  /** Full names (`label.com`). */
  alternatives: string[];
}

type LabelProblem = "empty" | "noLatin" | "tooShort" | "tooLong" | "invalid";

/** Why the field's content cannot be checked, or null when it can. */
function labelProblem(raw: string, label: string): LabelProblem | null {
  if (!raw.trim()) return "empty";
  if (!label) return "noLatin";
  if (label.length < 3) return "tooShort";
  if (label.length > MAX_LABEL_LENGTH) return "tooLong";
  return isValidLabel(label) ? null : "invalid";
}

const PROBLEM_KEYS = {
  empty: "errorEmpty",
  noLatin: "errorNoLatin",
  tooShort: "errorTooShort",
  tooLong: "errorTooLong",
  invalid: "errorInvalid",
} as const;

/** A domain name, kept left-to-right inside an Arabic sentence. */
function DomainName({ children }: { children: React.ReactNode }) {
  return (
    <bdi dir="ltr" className="font-bold text-studio-violet [overflow-wrap:anywhere]">
      {children}
    </bdi>
  );
}

/**
 * The custom domain's panel on the options step
 * (docs/superpowers/specs/2026-10-02-custom-domain-design.md, D3; the
 * approved mock-up's « Panneau sous la carte »).
 *
 * It opens below the extras grid, full width, while the « Domaine
 * personnalisé » card is ticked: the card is a `<button>`, and a text field
 * cannot sit inside one. The field keeps what the couple types and shows the
 * name that will be bought on the line below; it snaps to that name on blur,
 * because normalising while typing would make a hyphen impossible to type.
 */
export function CustomDomainPanel({
  id,
  open,
  years,
  price,
  monthsUntil,
  weddingYear,
}: {
  /** Referenced by the card's `aria-controls`. */
  id: string;
  open: boolean;
  years: number;
  price: number;
  monthsUntil: number | null;
  weddingYear: string;
}) {
  const t = useTranslations("CustomDomain");
  const reduced = useReducedMotion();
  const editRequested = useSearchParams().get("domain") === EDIT_DOMAIN_QUERY.domain;
  const inputId = useId();
  const statusId = useId();

  const raw = useOrderStore((s) => s.domain.label);
  const later = useOrderStore((s) => s.domain.later);
  const setDomain = useOrderStore((s) => s.setDomain);
  const partner1 = useOrderStore((s) => s.weddingInfo.partner1);
  const partner2 = useOrderStore((s) => s.weddingInfo.partner2);
  const hasHydrated = useOrderStore((s) => s._hasHydrated);

  const connector = t("connector");
  const label = normalizeLabel(raw);
  const problem = labelProblem(raw, label);

  /** Answers per label, for this visit: retyping a name does not ask again. */
  const [checks, setChecks] = useState<Record<string, CheckResult>>({});
  /** The label whose check failed (503, 429, network), cleared on the next keystroke. */
  const [failedLabel, setFailedLabel] = useState<string | null>(null);
  /** Set by « Choisir maintenant », so the field takes focus once it is back. */
  const focusOnShow = useRef(false);

  /*
   * Pre-fills the couple's names (`sophie-et-pierre`) when the panel opens on
   * an empty field. Read from the store rather than from render values so a
   * field the couple emptied themselves is not refilled while they type.
   * Names without Latin letters leave it empty: there is nothing to suggest.
   */
  useEffect(() => {
    if (!open || !hasHydrated) return;
    const { domain, weddingInfo } = useOrderStore.getState();
    if (domain.label || domain.later) return;
    const [first] = suggestLabels({
      partner1: weddingInfo.partner1,
      partner2: weddingInfo.partner2,
      connector,
      year: weddingYear,
    });
    if (first) setDomain({ label: first });
  }, [open, hasHydrated, connector, weddingYear, setDomain]);

  // Back from the checkout's refusal: bring the field into view and focus it,
  // once the panel has opened.
  useEffect(() => {
    if (!editRequested || !open || !hasHydrated) return;
    const frame = window.requestAnimationFrame(() => {
      const input = document.getElementById(inputId);
      input?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      input?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editRequested, open, hasHydrated, inputId, reduced]);

  const active = open && !later && hasHydrated;
  const cached = problem ? undefined : checks[label];

  // Debounced check. Each new label aborts the request before it, so only
  // the current label's answer ever lands.
  useEffect(() => {
    if (!active || problem || cached) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/custom-domains/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, partner1, partner2, connector, year: weddingYear }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`check: HTTP ${res.status}`);
        const data = (await res.json()) as CheckResult;
        setChecks((previous) => ({
          ...previous,
          [label]: {
            available: data.available === true,
            reason: data.reason ?? null,
            alternatives: Array.isArray(data.alternatives) ? data.alternatives : [],
          },
        }));
      } catch {
        if (!controller.signal.aborted) setFailedLabel(label);
      }
    }, CHECK_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [active, problem, cached, label, partner1, partner2, connector, weddingYear]);

  function onChange(value: string) {
    setFailedLabel(null);
    setDomain({ label: value });
  }

  function onBlur() {
    if (label !== raw && isValidLabel(label)) setDomain({ label });
  }

  function pickAlternative(name: string) {
    const picked = normalizeLabel(name);
    // The server has just called it free: no need to ask again.
    setChecks((previous) => ({
      ...previous,
      [picked]: { available: true, reason: null, alternatives: [] },
    }));
    setFailedLabel(null);
    setDomain({ label: picked });
    document.getElementById(inputId)?.focus({ preventScroll: true });
  }

  function chooseNow() {
    focusOnShow.current = true;
    setDomain({ later: false });
  }

  const transition = { duration: reduced ? 0 : 0.34, ease: EASE };
  const name = toDomainName(label);
  const unknownAnswer = cached && !cached.available && cached.reason === "unknown";
  const showAlternatives = cached && !cached.available && !unknownAnswer;

  function status() {
    if (problem) {
      return (
        <span className={problem === "empty" ? "text-studio-violet/60" : "font-semibold text-red-600"}>
          {t(PROBLEM_KEYS[problem])}
        </span>
      );
    }
    if (failedLabel === label || unknownAnswer) {
      return (
        <>
          <DomainName>{name}</DomainName>
          <span className="text-studio-violet/60">{t("checkUnavailable")}</span>
        </>
      );
    }
    if (!cached) {
      return (
        <>
          <Loader2 aria-hidden className="h-3 w-3 shrink-0 animate-spin text-studio-violet" />
          <span>{t.rich("checking", { domain: name, name: (chunks) => <DomainName>{chunks}</DomainName> })}</span>
        </>
      );
    }
    if (cached.available) {
      return (
        <>
          <DomainName>{name}</DomainName>
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-700">
            <Check aria-hidden className="h-3 w-3" strokeWidth={2.5} />
            {t("available")}
          </span>
        </>
      );
    }
    return (
      <>
        <DomainName>{name}</DomainName>
        <span className="whitespace-nowrap rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
          {cached.reason === "taken" ? t("taken") : t("notForSale")}
        </span>
      </>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          id={id}
          key="custom-domain-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transition}
          className="overflow-hidden"
        >
          <div className="pt-3">
            <div className="studio-card-border studio-card-fill relative flex flex-col gap-3 rounded-2xl p-4">
              {/* Points at the card above it, the last of the grid: the second
                  column, which `start` mirrors in Arabic. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-1.5 start-[calc(75%+3px)] -ms-1.5 h-3 w-3 rotate-45 border-l border-t border-studio-violet-fonce/[0.14] bg-studio-card-bg"
              />

              <AnimatePresence initial={false}>
                {later ? (
                  <motion.div
                    key="later"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={transition}
                    className="overflow-hidden"
                  >
                    <div className="flex items-start gap-2.5 rounded-xl bg-studio-lavande/20 p-3">
                      <Clock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-studio-violet/70" />
                      <div>
                        <p className="font-body text-[13px] font-semibold text-studio-violet">{t("laterNote")}</p>
                        <button
                          type="button"
                          onClick={chooseNow}
                          className="py-1.5 font-body text-xs font-semibold text-studio-violet/75 underline decoration-studio-lavande underline-offset-[3px] transition-colors hover:text-studio-violet hover:decoration-studio-violet"
                        >
                          {t("chooseNow")}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="field"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={transition}
                    // Room for the field's focus ring, which `overflow-hidden` would clip.
                    className="-mx-[3px] overflow-hidden px-[3px]"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div>
                        <label
                          htmlFor={inputId}
                          className="mb-1.5 block font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-studio-violet/70"
                        >
                          {t("fieldLabel")}
                        </label>
                        <div
                          dir="ltr"
                          className="flex h-12 items-center rounded-xl border border-studio-lavande/40 bg-studio-card-bg px-4 transition-[border-color,box-shadow] focus-within:border-studio-violet/50 focus-within:ring-[3px] focus-within:ring-studio-violet/[0.08]"
                        >
                          <input
                            id={inputId}
                            ref={(el) => {
                              if (el && focusOnShow.current) {
                                focusOnShow.current = false;
                                el.focus({ preventScroll: true });
                              }
                            }}
                            type="text"
                            dir="ltr"
                            value={raw}
                            maxLength={120}
                            onChange={(e) => onChange(e.target.value)}
                            onBlur={onBlur}
                            autoComplete="off"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            aria-describedby={statusId}
                            aria-invalid={problem !== null && problem !== "empty"}
                            className="h-full min-w-0 flex-1 bg-transparent font-body text-sm font-medium text-studio-violet outline-none placeholder:text-studio-violet/35"
                          />
                          <span aria-hidden className="ps-0.5 font-body text-sm font-bold text-studio-violet/45">
                            .com
                          </span>
                        </div>

                        <div
                          id={statusId}
                          aria-live="polite"
                          className="mt-2 flex min-h-[22px] flex-wrap items-center gap-x-2 gap-y-1 font-body text-xs text-studio-violet/70"
                        >
                          {status()}
                        </div>

                        {showAlternatives && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {cached.alternatives.length > 0 ? (
                              <>
                                <span className="font-body text-[11px] font-semibold text-studio-violet/60">
                                  {t("alternatives")}
                                </span>
                                {cached.alternatives.map((alternative) => (
                                  <button
                                    key={alternative}
                                    type="button"
                                    onClick={() => pickAlternative(alternative)}
                                    className="max-w-full rounded-full border border-studio-lavande/80 bg-white px-2.5 py-1.5 font-body text-xs font-semibold text-studio-violet transition-colors [overflow-wrap:anywhere] hover:border-studio-violet hover:bg-studio-lavande/10"
                                  >
                                    <bdi dir="ltr">{alternative}</bdi>
                                  </button>
                                ))}
                              </>
                            ) : (
                              <span className="font-body text-[11px] font-semibold text-studio-violet/60">
                                {t("noAlternatives")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="flex items-start gap-2 rounded-xl bg-studio-jaune/50 px-3 py-2.5 font-body text-xs leading-[1.45] text-studio-violet/90">
                        <Info aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
                        <span>{t("warning")}</span>
                      </p>

                      <button
                        type="button"
                        onClick={() => setDomain({ later: true })}
                        className="self-start py-1.5 font-body text-xs font-semibold text-studio-violet/75 underline decoration-studio-lavande underline-offset-[3px] transition-colors hover:text-studio-violet hover:decoration-studio-violet"
                      >
                        {t("later")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 border-t border-studio-lavande/30 pt-3 font-body text-xs text-studio-violet/65">
                {years === 1 || monthsUntil === null
                  ? t.rich("priceOneYear", { price, years, strong })
                  : t.rich("priceYears", { price, years, months: monthsUntil, strong })}
              </p>
              <p className="-mt-1.5 font-body text-[11px] text-studio-violet/50">{t("cover")}</p>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function strong(chunks: React.ReactNode) {
  return <strong className="text-base font-bold text-studio-violet">{chunks}</strong>;
}

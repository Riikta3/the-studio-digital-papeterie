"use client";

import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useEditor } from "./EditorProvider";
import { formatEuros } from "./format-euros";
import { canOfferPayment } from "./payment-flow";

/** Laptop: a chip in the header row. Hidden while there are unsaved changes — « Enregistrer » comes first. */
export function DueChip() {
  const t = useTranslations("Editor");
  const locale = useLocale();
  const { due, isDirty, openPayment } = useEditor();
  if (!canOfferPayment(due, isDirty)) return null;

  return (
    <button
      type="button"
      onClick={() => openPayment()}
      className="hidden h-8 shrink-0 items-center gap-1.5 rounded-full bg-amber-100 px-3 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-200 lg:inline-flex"
    >
      <Lock className="h-3.5 w-3.5" aria-hidden="true" />
      {t("due.chip", { count: due.modules.length, price: formatEuros(due.amountCents, locale) })}
    </button>
  );
}

/**
 * Phone: nothing fits beside the title — the mock-up that tried squeezed
 * « Mon faire-part » onto three lines — so a strip under the tabs, except on
 * the unpaid module's own tab, whose banner already says it.
 */
export function DueStrip() {
  const t = useTranslations("Editor");
  const locale = useLocale();
  const { due, isDirty, openPayment, activeSection } = useEditor();
  if (!canOfferPayment(due, isDirty) || due.modules.includes(activeSection)) return null;

  return (
    <div className="flex items-center gap-3 border-t border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 lg:hidden">
      <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1">{t("due.strip", { count: due.modules.length })}</span>
      <button
        type="button"
        onClick={() => openPayment()}
        className="shrink-0 rounded-full bg-amber-800 px-3 py-1.5 text-xs font-bold text-white"
      >
        {t("moduleStatus.pay", { price: formatEuros(due.amountCents, locale) })}
      </button>
    </div>
  );
}

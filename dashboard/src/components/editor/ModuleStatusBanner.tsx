"use client";

import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { EXTRA_MODULE_PRICE } from "@shared/lib/pricing";
import { cn } from "@shared/lib/utils";
import { Gift, Lock, Sparkles, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { useEditor } from "./EditorProvider";
import { formatEuros } from "./format-euros";
import { canOfferPayment } from "./payment-flow";

/**
 * Above the form of a module guests cannot see yet: what it costs, how it
 * goes live, and how to take it back (spec D1).
 */
export function ModuleStatusBanner() {
  const t = useTranslations("Editor.moduleStatus");
  const locale = useLocale();
  const { activeSection, statusOf, unpaid, due, isDirty, openPayment, removeModule } = useEditor();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const status = statusOf(activeSection);
  if (status !== "draft" && status !== "unpaid") return null;

  const price = formatEuros(EXTRA_MODULE_PRICE * 100, locale);
  const tone = status === "unpaid" ? "due" : unpaid.billable.includes(activeSection) ? "trial" : "included";
  const Icon = tone === "trial" ? Sparkles : tone === "included" ? Gift : Lock;

  const remove = async () => {
    setRemoving(true);
    await removeModule(activeSection);
    setRemoving(false);
    setConfirming(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 md:px-6 md:pt-6">
      <div
        className={cn(
          "flex flex-wrap items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed",
          tone === "trial" && "border-studio-violet-clair/25 bg-studio-card-selected text-studio-violet",
          tone === "included" && "border-emerald-200 bg-emerald-50 text-emerald-800",
          tone === "due" && "border-amber-200 bg-amber-50 text-amber-900",
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="min-w-[12rem] flex-1">
          <p className="font-semibold">
            {tone === "trial" ? t("trialTitle") : tone === "included" ? t("includedTitle") : t("dueTitle")}
          </p>
          <p className="mt-0.5">
            {tone === "trial" ? t("trialBody", { price }) : tone === "included" ? t("includedBody") : t("dueBody", { price })}
          </p>
        </div>
        {tone === "due" && canOfferPayment(due, isDirty) ? (
          <Button
            type="button"
            onClick={() => openPayment()}
            className="h-9 rounded-full bg-amber-800 px-4 text-sm font-semibold text-white hover:bg-amber-900"
          >
            {t("pay", { price: formatEuros(due.amountCents, locale) })}
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        {t("remove")}
      </button>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeTitle")}</DialogTitle>
            <DialogDescription>{t("removeBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              {t("removeCancel")}
            </Button>
            <Button
              type="button"
              disabled={removing}
              onClick={() => void remove()}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {t("removeConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

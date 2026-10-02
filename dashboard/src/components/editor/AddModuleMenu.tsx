"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover";
import {
  APP_MODULES,
  getModuleDescription,
  getModuleName,
} from "@shared/data/modules";
import { addableModules } from "@shared/lib/addable-modules";
import {
  EXTRA_MODULE_PRICE,
  FREE_MODULES_LIMIT,
  addOnQuote,
  hasMeteredAddOns,
} from "@shared/lib/pricing";
import { cn } from "@shared/lib/utils";
import { Gift, Plus, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type ComponentPropsWithoutRef, forwardRef, useState } from "react";

import { BottomSheet } from "./BottomSheet";
import { useEditor } from "./EditorProvider";
import { formatEuros } from "./format-euros";
import { draftedModules } from "./module-status";

/** Plan names as sold — product names, the same in every language. */
const PLAN_NAMES: Record<string, string> = {
  signature: "Signature",
  "sur-mesure": "Sur-mesure",
  prestige: "Prestige",
  premium: "Premium",
  experience: "Expérience",
};

/**
 * The modules the couple's theme draws and they do not have yet, priced as
 * the next one would be. Choosing one adds it to the draft and opens its
 * section; nothing is saved or paid until « Enregistrer » (spec D1).
 */
export function useAddModuleChoices() {
  const t = useTranslations("Editor");
  const locale = useLocale();
  const { meta, draft } = useEditor();

  const taken = [...meta.pendingModules, ...draftedModules(draft, meta)];
  const choices = addableModules(meta.themeId, meta.ownedModules, taken);
  const counted = meta.ownedModules.length + taken.length;
  const nextIsPaid = addOnQuote(meta.planId, counted, 1).billable > 0;
  const price = formatEuros(EXTRA_MODULE_PRICE * 100, locale);
  const plan = PLAN_NAMES[meta.planId ?? ""] ?? "none";
  const summary = hasMeteredAddOns(meta.planId)
    ? t("addModule.planMetered", {
        plan,
        remaining: Math.max(0, FREE_MODULES_LIMIT - counted),
        price,
      })
    : t("addModule.planUnlimited", { plan });
  const available = nextIsPaid
    ? t("addModule.available", { count: choices.length, price })
    : t("addModule.availableIncluded", { count: choices.length });

  return { choices, nextIsPaid, price, summary, available };
}

/** The menu itself: the plan's allowance, the modules with their price, how paying works. */
function AddModuleList({ onChoose }: { onChoose: (id: string) => void }) {
  const t = useTranslations("Editor");
  const tm = useTranslations("Modules");
  const { choices, nextIsPaid, price, summary } = useAddModuleChoices();

  return (
    <div className="flex max-h-[min(70vh,560px)] flex-col">
      <div className="border-b border-studio-lavande/40 px-5 pb-3 pt-4">
        <p className="font-heading text-xl text-studio-violet">
          {t("addModule.title")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-studio-violet/70">
          {summary}
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {choices.map((id) => {
          const Icon = APP_MODULES.find((module) => module.id === id)?.icon;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChoose(id)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-start transition-colors hover:bg-studio-card-bg focus-visible:bg-studio-card-selected focus-visible:outline-none"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-studio-card-selected text-studio-violet-clair">
                  {Icon ? (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-studio-violet">
                    {getModuleName(tm, id)}
                  </span>
                  <span className="block truncate text-xs text-studio-violet/60">
                    {getModuleDescription(tm, id)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    nextIsPaid
                      ? "bg-studio-card-selected text-studio-violet-clair"
                      : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {nextIsPaid ? price : t("addModule.included")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="flex items-start gap-2 border-t border-studio-lavande/40 px-5 py-3 text-xs leading-relaxed text-studio-violet/80">
        {nextIsPaid ? (
          <Sparkles
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />
        ) : (
          <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        )}
        {nextIsPaid ? t("addModule.footPaid") : t("addModule.footIncluded")}
      </p>
    </div>
  );
}

/**
 * « Ajouter un module », filled and with the number on offer: the dashed
 * outline it replaced went unnoticed at the end of the tabs.
 */
export const AddModuleTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<"button"> & { count: number }
>(function AddModuleTrigger({ count, className, ...props }, ref) {
  const t = useTranslations("Editor");
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-studio-violet-clair to-studio-violet px-4 text-sm font-bold text-white",
        "shadow-[0_8px_20px_rgba(117,96,177,0.35)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(117,96,177,0.42)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-violet-clair/60 focus-visible:ring-offset-2",
        className,
      )}
    >
      <Plus className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      {t("tabs.addModule")}
      <span className="rounded-full bg-white/20 px-2 py-px text-xs">{count}</span>
    </button>
  );
});

/** Laptop: at the foot of the summary, its menu opening beside it. */
export function AddModuleRailButton() {
  const locale = useLocale();
  const { addModule } = useEditor();
  const { choices, available } = useAddModuleChoices();
  const [open, setOpen] = useState(false);
  if (choices.length === 0) return null;

  return (
    <div className="border-t border-studio-lavande/35 bg-studio-creme/60 p-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <AddModuleTrigger count={choices.length} />
        </PopoverTrigger>
        <PopoverContent
          side={locale === "ar" ? "left" : "right"}
          align="end"
          sideOffset={12}
          className="w-[380px] overflow-hidden rounded-3xl border-studio-lavande/60 bg-white p-0 shadow-studio-card"
        >
          <AddModuleList
            onChoose={(id) => {
              setOpen(false);
              addModule(id);
            }}
          />
        </PopoverContent>
      </Popover>
      <p className="mt-1.5 text-center text-xs text-studio-violet/60">
        {available}
      </p>
    </div>
  );
}

/** Phone: the same menu, as a sheet — opened from the summary's sheet. */
export function AddModuleSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Editor");
  const { addModule } = useEditor();

  return (
    <BottomSheet
      open={open}
      onClose={() => onOpenChange(false)}
      label={t("addModule.title")}
    >
      <AddModuleList
        onChoose={(id) => {
          onOpenChange(false);
          addModule(id);
        }}
      />
    </BottomSheet>
  );
}

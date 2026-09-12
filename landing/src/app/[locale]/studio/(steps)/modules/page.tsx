"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { APP_MODULES, getModuleDescription, getModuleName } from "@shared/data/modules";
import { cn } from "@shared/lib/utils";
import { StepTransition } from "@/components/studio/StepTransition";
import {
  EXTRA_MODULE_PRICE,
  FREE_MODULES_LIMIT,
  hasMeteredModules,
} from "@/lib/pricing";
import { useOrderStore } from "@/stores/use-order-store";

export default function StudioModulesPage() {
  const t = useTranslations("StudioModules");
  const { modules, toggleModule, plan } = useOrderStore();

  // Three plans, three different answers to "how many modules do I get?":
  //   signature   → FREE_MODULES_LIMIT included, then EXTRA_MODULE_PRICE each
  //   sur-mesure  → unlimited, all included
  //   prestige    → unlimited too, but the plan is a bespoke creation rather
  //                 than a list of modules, so it is worded differently
  // The page used to know only "metered or not", which told a Sur-mesure
  // couple "all modules are included in your plan" without ever saying the
  // word unlimited, and told a Prestige couple the same generic sentence.
  const isEssential = hasMeteredModules(plan);
  const isPrestige = plan === "prestige";
  const extraCount = isEssential
    ? Math.max(0, modules.length - FREE_MODULES_LIMIT)
    : 0;
  const extraCost = extraCount * EXTRA_MODULE_PRICE;

  const subtitle = isEssential
    ? t("subtitleEssential", {
        included: FREE_MODULES_LIMIT,
        price: EXTRA_MODULE_PRICE,
      })
    : isPrestige
      ? t("subtitlePrestige")
      : t("subtitleUnlimited");

  function counterLabel() {
    if (modules.length === 0) {
      return isEssential
        ? t("selectAtLeast", { min: FREE_MODULES_LIMIT })
        : t("noneSelected");
    }
    if (isEssential && modules.length < FREE_MODULES_LIMIT) {
      return t("minCount", { count: modules.length, min: FREE_MODULES_LIMIT });
    }
    const base = t("countSelected", { count: modules.length });
    // Unlimited plans: say so on the counter rather than leaving a bare number
    // that looks like it might be approaching a cap.
    if (!isEssential) return `${base} · ${t("unlimited")}`;
    return extraCost > 0 ? `${base} · +${extraCost}€` : `${base} · ${t("included")}`;
  }

  return (
    <StepTransition>
      <div className="flex flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-h2 leading-tight text-studio-violet">
            {t("titlePrefix")}
            <span className="text-studio-pourpre">{t("titleHighlight")}</span>
          </h1>
          <p className="mx-auto max-w-sm font-body text-sm text-studio-violet/60">
            {subtitle}
          </p>
        </div>

        {/* Counter */}
        <div className="flex justify-center">
          <span
            className={cn(
              "rounded-full px-4 py-1.5 font-body text-xs font-semibold",
              modules.length === 0
                ? "bg-studio-lavande/20 text-studio-violet/60"
                : isEssential && modules.length < FREE_MODULES_LIMIT
                  ? "bg-amber-50 text-amber-600"
                  : "bg-studio-lavande/30 text-studio-violet",
            )}
          >
            {counterLabel()}
          </span>
        </div>

        {/* Grid */}
        <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-6">
          {APP_MODULES.map((mod) => {
            const isSelected = modules.includes(mod.id);
            // In the Essential plan, anything past the 4th pick costs extra.
            const isExtra =
              isEssential && isSelected && modules.indexOf(mod.id) >= FREE_MODULES_LIMIT;
            const Icon = mod.icon;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => toggleModule(mod.id)}
                className={cn(
                  "studio-card-border studio-card-fill relative flex flex-col gap-3 rounded-2xl p-4 text-left transition-shadow duration-200",
                  isSelected && "ring-2 ring-studio-violet",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-studio-violet text-white"
                      : "bg-studio-lavande/20 text-studio-violet/60",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <p className="font-body text-[13px] font-semibold leading-tight text-studio-violet">
                    {getModuleName(t, mod.id)}
                  </p>
                  <p className="mt-1 line-clamp-2 font-body text-[11px] leading-relaxed text-studio-violet/60">
                    {getModuleDescription(t, mod.id)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  {isExtra ? (
                    <span className="rounded-full bg-studio-lavande/30 px-2 py-0.5 font-body text-[10px] font-bold text-studio-violet">
                      +5€
                    </span>
                  ) : (
                    <span />
                  )}
                  <div
                    className={cn(
                      "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-colors",
                      isSelected
                        ? "border-studio-lavande bg-studio-violet-fonce"
                        : "border-studio-lavande/60 bg-white",
                    )}
                  >
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={1.75} />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </StepTransition>
  );
}

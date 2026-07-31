"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { APP_MODULES } from "@shared/data/modules";
import { cn } from "@shared/lib/utils";
import { StepTransition } from "@/components/studio/StepTransition";
import { useOrderStore } from "@/stores/use-order-store";

export default function StudioModulesPage() {
  const t = useTranslations("StudioModules");
  const { modules, toggleModule, plan } = useOrderStore();

  const isEssential = plan === "experience";
  const extraCount = isEssential ? Math.max(0, modules.length - 4) : 0;
  const extraCost = extraCount * 5;

  function counterLabel() {
    if (modules.length === 0) {
      return isEssential ? t("selectAtLeast") : t("noneSelected");
    }
    if (isEssential && modules.length < 4) {
      return t("minCount", { count: modules.length });
    }
    const base = t("countSelected", { count: modules.length });
    if (!isEssential) return base;
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
            {isEssential ? t("subtitleEssential") : t("subtitlePremium")}
          </p>
        </div>

        {/* Counter */}
        <div className="flex justify-center">
          <span
            className={cn(
              "rounded-full px-4 py-1.5 font-body text-xs font-semibold",
              modules.length === 0
                ? "bg-studio-lavande/20 text-studio-violet/60"
                : isEssential && modules.length < 4
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
              isEssential && isSelected && modules.indexOf(mod.id) >= 4;
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
                    {mod.name}
                  </p>
                  <p className="mt-1 line-clamp-2 font-body text-[11px] leading-relaxed text-studio-violet/60">
                    {mod.description}
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

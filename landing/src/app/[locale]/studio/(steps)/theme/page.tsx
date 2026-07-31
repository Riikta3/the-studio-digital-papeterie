"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@shared/lib/utils";
import { StepTransition } from "@/components/studio/StepTransition";
import { THEMES } from "@/components/studio/themes";
import { useOrderStore } from "@/stores/use-order-store";

export default function StudioThemePage() {
  const t = useTranslations("StudioTheme");
  const { theme, setTheme, weddingInfo } = useOrderStore();

  // Preview the couple's own details when they're known, so the theme is
  // judged on real content rather than placeholders.
  const couple =
    weddingInfo.partner1 && weddingInfo.partner2
      ? `${weddingInfo.partner1} & ${weddingInfo.partner2}`
      : "Sophie & Pierre";
  const date =
    weddingInfo.day && weddingInfo.month && weddingInfo.year
      ? `${weddingInfo.day} ${weddingInfo.month} ${weddingInfo.year}`
      : "14 Juin 2026";
  const venue = weddingInfo.venue || "Château des Roses";

  return (
    <StepTransition>
      <div className="flex flex-col gap-6">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-h2 leading-tight text-studio-violet">
            {t("titlePrefix")}
            <span className="text-studio-pourpre">{t("titleHighlight")}</span>
          </h1>
          <p className="mx-auto max-w-xs font-body text-sm text-studio-violet/60">
            {t("subtitle")}
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-6">
          {THEMES.map((th) => {
            const isSelected = theme === th.id;
            return (
              <div
                key={th.id}
                onClick={() => setTheme(th.id)}
                className={cn(
                  "studio-card-border studio-card-fill cursor-pointer overflow-hidden rounded-2xl transition-shadow duration-200",
                  isSelected && "ring-2 ring-studio-violet",
                )}
              >
                {/* Typographic preview in the theme's own style */}
                <div
                  className="relative flex aspect-[3/4] flex-col items-center justify-center gap-2 overflow-hidden"
                  style={{ background: th.bgGradient }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.05] [background-size:18px_18px]" />
                  <span
                    className="relative z-10 break-words px-3 text-center text-[16px] leading-tight"
                    style={{
                      color: th.accentColor,
                      fontFamily: th.coupleFont,
                      fontWeight: th.coupleWeight ?? "700",
                      letterSpacing: th.coupleLetterSpacing,
                      fontStyle: th.coupleStyle ?? "normal",
                    }}
                  >
                    {couple}
                  </span>
                  <div
                    className="relative z-10 h-[2px] w-6 rounded-full"
                    style={{ background: th.accentColor }}
                  />
                  <span
                    className="relative z-10 text-[9px] uppercase tracking-[0.18em]"
                    style={{
                      color: th.dateColor ?? th.accentColor,
                      opacity: 0.65,
                    }}
                  >
                    {date}
                  </span>
                  <span
                    className="relative z-10 px-3 text-center text-[10px]"
                    style={{
                      color: th.placeColor ?? th.accentColor,
                      fontFamily: th.placeFont,
                      fontStyle: th.placeStyle ?? "normal",
                      opacity: 0.5,
                      ...(th.placeExtra ?? {}),
                    }}
                  >
                    {venue}
                  </span>

                  {isSelected && (
                    <div className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-studio-violet-fonce">
                      <Check className="h-4 w-4 text-white" strokeWidth={1.75} />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-studio-lavande/30 px-3.5 py-3">
                  <p className="mb-0.5 font-body text-sm font-semibold leading-none text-studio-violet">
                    {th.name}
                  </p>
                  <p className="line-clamp-1 font-body text-[11px] text-studio-violet/60">
                    {th.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </StepTransition>
  );
}

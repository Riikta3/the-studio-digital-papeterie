"use client";

import { cn } from "@shared/lib/utils";
import { Check, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useState } from "react";

import { StepTransition } from "@/components/studio/StepTransition";
import { ThemeDemoSheet } from "@/components/studio/ThemeDemoSheet";
import { THEMES, type Theme } from "@/components/studio/themes";
import { useOrderStore } from "@/stores/use-order-store";

/**
 * The theme step: every theme's real cover, as on the home page's carousel.
 * Tapping a cover picks it; « Voir la démo » opens its demo in the same phone
 * mockup as the home page, from which it can be picked too.
 *
 * The list is the home page's (`components/home/themes.ts`), so a new theme
 * shows up here without touching this file.
 */
export default function StudioThemePage() {
  const t = useTranslations("StudioTheme");
  const { theme, setTheme } = useOrderStore();
  const [demo, setDemo] = useState<Theme | null>(null);
  const closeDemo = useCallback(() => setDemo(null), []);

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

        <div className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
          {THEMES.map((th) => {
            const isSelected = theme === th.id;
            return (
              <div
                key={th.id}
                className={cn(
                  "studio-card-border studio-card-fill overflow-hidden rounded-2xl transition-shadow duration-200",
                  isSelected && "ring-2 ring-studio-violet",
                )}
              >
                <button
                  type="button"
                  onClick={() => setTheme(th.id)}
                  aria-pressed={isSelected}
                  aria-label={th.name}
                  className="group relative block aspect-[290/540] w-full overflow-hidden"
                >
                  <Image
                    src={th.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 220px, 45vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  {isSelected && (
                    <span className="absolute right-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-studio-violet-fonce">
                      <Check className="h-4 w-4 text-white" strokeWidth={1.75} />
                    </span>
                  )}
                </button>

                <div className="flex flex-col items-start gap-1 border-t border-studio-lavande/30 px-3 py-2.5">
                  <p className="w-full truncate font-body text-sm font-semibold text-studio-violet">
                    {th.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setDemo(th)}
                    className="-ms-2 flex items-center gap-1 rounded-full px-2 py-1 font-body text-[11px] font-semibold text-studio-violet/70 transition-colors hover:bg-studio-lavande/30 hover:text-studio-violet"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("viewDemo")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ThemeDemoSheet
        theme={demo}
        selected={demo !== null && theme === demo.id}
        onChoose={() => {
          if (demo) setTheme(demo.id);
          closeDemo();
        }}
        onClose={closeDemo}
      />
    </StepTransition>
  );
}

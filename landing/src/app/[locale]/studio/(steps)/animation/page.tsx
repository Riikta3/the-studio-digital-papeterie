"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@shared/lib/utils";
import { AnimationPreviewOverlay } from "@/components/studio/AnimationPreviewOverlay";
import { StepTransition } from "@/components/studio/StepTransition";
import {
  ANIMATION_CATEGORIES,
  getAnimationPreview,
  hasAnimationMedia,
  type AnimationVariant,
} from "@/components/studio/animations";
import { useOrderStore } from "@/stores/use-order-store";

export default function StudioAnimationPage() {
  const t = useTranslations("StudioAnimation");
  const { animation, setAnimation } = useOrderStore();
  const [activeCategory, setActiveCategory] = useState("envelope");
  const [previewVariant, setPreviewVariant] = useState<AnimationVariant | null>(
    null,
  );

  const currentCategory =
    ANIMATION_CATEGORIES.find((c) => c.id === activeCategory) ??
    ANIMATION_CATEGORIES[0];

  return (
    <StepTransition>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-h2 leading-tight text-studio-violet">
            {t("titlePrefix")}
            <span className="text-studio-pourpre">{t("titleHighlight")}</span>
          </h1>
          <p className="mx-auto max-w-xs font-body text-sm text-studio-violet/60">
            {t("subtitle")}
          </p>
        </div>

        {/* Category pills */}
        <div className="scrollbar-hide flex justify-center gap-2 overflow-x-auto">
          {ANIMATION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex-none whitespace-nowrap rounded-full border px-4 py-2 font-body text-sm transition-colors",
                activeCategory === cat.id
                  ? "border-studio-violet bg-studio-violet text-white"
                  : "border-studio-lavande/60 bg-white text-studio-violet/70 hover:border-studio-violet/40 hover:text-studio-violet",
              )}
            >
              {t(`categories.${cat.id}`)}
            </button>
          ))}
        </div>

        {/* Variant grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mx-auto grid w-full max-w-2xl grid-cols-2 gap-6"
          >
            {currentCategory.variants.map((v) => {
              const previewImg = getAnimationPreview(v.id);
              const isSelected = animation === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => setAnimation(v.id)}
                  className={cn(
                    "studio-card-border studio-card-fill group relative cursor-pointer overflow-hidden rounded-2xl transition-shadow duration-200",
                    isSelected && "ring-2 ring-studio-violet",
                  )}
                >
                  {/* Preview */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-studio-card-bg">
                    {previewImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewImg}
                        alt={v.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-studio-lavande/10">
                        <span className="font-body text-[11px] text-studio-violet/40">
                          {t("comingSoon")}
                        </span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-studio-violet-fonce">
                        <Check
                          className="h-4 w-4 text-white"
                          strokeWidth={1.75}
                        />
                      </div>
                    )}

                    {hasAnimationMedia(v.id) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewVariant(v);
                        }}
                        className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-studio-lavande/50 bg-white/90 px-4 py-1.5 font-body text-[11px] font-semibold text-studio-violet backdrop-blur-sm"
                      >
                        <Eye className="h-3 w-3" />
                        {t("viewDemo")}
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-studio-lavande/30 px-3.5 py-3">
                    <p className="mb-0.5 font-body text-sm font-semibold leading-none text-studio-violet">
                      {v.name}
                    </p>
                    <p className="line-clamp-1 font-body text-[11px] text-studio-violet/60">
                      {v.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {previewVariant && (
          <AnimationPreviewOverlay
            animationId={previewVariant.id}
            animationName={`${t(`categories.${currentCategory.id}`)} — ${previewVariant.name}`}
            initialDevice={
              typeof window !== "undefined" && window.innerWidth < 768
                ? "mobile"
                : "desktop"
            }
            onClose={() => setPreviewVariant(null)}
            onSelect={() => {
              setAnimation(previewVariant.id);
              setPreviewVariant(null);
            }}
          />
        )}
      </AnimatePresence>
    </StepTransition>
  );
}

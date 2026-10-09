"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { PhoneFrame } from "@/components/home/PhoneFrame";
import type { Theme } from "@/components/home/themes";

/**
 * A theme's demo in the home page's phone mockup, from the studio's theme
 * step: a sheet rising from the bottom, like the plans' comparison, with a
 * button to pick the theme from there.
 */
export function ThemeDemoSheet({
  theme,
  selected,
  onChoose,
  onClose,
}: {
  theme: Theme | null;
  selected: boolean;
  onChoose: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("StudioTheme");
  const tClose = useTranslations("ThemeConfigSheet");
  // Portalled to <body>: the studio's step transition sets a transform, which
  // would make this fixed sheet fixed to the step's column, not the screen.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only portal target
  useEffect(() => setMounted(true), []);

  // Escape to dismiss, and the page behind locked while the sheet is up.
  useEffect(() => {
    if (!theme) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [theme, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {theme && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={theme.name}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[96dvh] flex-col rounded-t-[32px] bg-studio-beurre"
          >
            <div className="flex shrink-0 items-center justify-between gap-4 px-6 pb-3 pt-5 md:px-10">
              <h3 className="font-heading text-h3 text-studio-violet">{theme.name}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label={tClose("closeAriaLabel")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-studio-violet text-studio-jaune shadow-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 md:px-10">
              <div className="mx-auto w-full max-w-[416px]">
                <PhoneFrame theme={theme} fitHeight={200} />
              </div>
            </div>

            <div className="flex shrink-0 justify-center px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
              <button
                type="button"
                onClick={onChoose}
                className="flex items-center gap-2 rounded-full bg-studio-violet px-6 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-studio-violet-fonce"
              >
                {selected ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                {selected ? t("selected") : t("choose")}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

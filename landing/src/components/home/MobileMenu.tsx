"use client";

import { Button } from "@shared/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Link } from "@/navigation";

import { LanguageSwitcher } from "./LanguageSwitcher";

// Order matches MobileMenu.productLinks in the message files, which
// mirrors the page's actual section order (see [locale]/page.tsx).
const PRODUCT_LINK_ANCHORS = [
  "accueil",
  "demo",
  "fonctionnalites",
  "tarifs",
  "sur-mesure",
  "espace-maries",
  "temoignages",
  "faq",
];
// Sign-in is in the dashboard app, a different origin: there is no /login page
// here, so an in-app <Link> 404s. Absolute URL, plain anchor below.
const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:3003";
const MARIES_LINK_HREFS = [`${DASHBOARD_URL}/fr/login`];

export function MobileMenu({
  open,
  onClose,
  hideCreateButton = false,
}: {
  open: boolean;
  onClose: () => void;
  hideCreateButton?: boolean;
}) {
  const t = useTranslations("MobileMenu");
  const productLabels = t.raw("productLinks") as string[];
  const mariesLabels = t.raw("mariesLinks") as string[];

  const scrollToAnchor = (anchor: string) => {
    onClose();
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  };

  // Lock body scroll while the sidebar is open. Compensate for the
  // vanishing scrollbar with matching padding so the page doesn't
  // visibly shift sideways when it locks.
  useEffect(() => {
    if (!open) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label={t("ariaLabel")}
            className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col overflow-y-auto rounded-l-3xl bg-studio-violet px-6 py-8"
          >
            <div className="flex items-center justify-between">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeAriaLabel")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-10">
              <p className="font-body text-h5 tracking-luxe text-white/50">
                {t("colProduct")}
              </p>
              <ul className="mt-4 flex flex-col gap-4">
                {productLabels.map((label, i) => (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() =>
                        scrollToAnchor(PRODUCT_LINK_ANCHORS[i] ?? "accueil")
                      }
                      className="font-body text-base text-studio-jaune"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              <p className="mt-8 font-body text-h5 tracking-luxe text-white/50">
                {t("colMaries")}
              </p>
              <ul className="mt-4 flex flex-col gap-4">
                {mariesLabels.map((label, i) => (
                  <li key={label}>
                    {/* Another origin, so a plain anchor: next-intl's Link
                        would prefix it with a locale. */}
                    <a
                      href={MARIES_LINK_HREFS[i] ?? "#"}
                      onClick={onClose}
                      className="font-body text-base text-studio-jaune"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {!hideCreateButton && (
              <Button variant="studio-jaune" size="pill" className="mt-8" asChild>
                <Link href="/studio/start" onClick={onClose}>
                  {t("createButton")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

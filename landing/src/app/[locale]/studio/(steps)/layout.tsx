"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import { MobileMenu } from "@/components/home/MobileMenu";
import { useHeaderReveal } from "@/lib/use-header-reveal";
import { usePathname, useRouter } from "@/navigation";
import { FREE_MODULES_LIMIT, hasMeteredModules } from "@/lib/pricing";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";

// /start lives outside this layout: it keeps its own nav and CTA.
// The dots still count it as the first of five steps.
//
// The entrance animation no longer has a step of its own: it is chosen in the
// home page's theme dialog ("Style d'ouverture") and, failing that, defaults
// in `create-wedding`. It is still stored on the order and shown in the
// checkout summary.
const STEPS = [
  "/studio/start",
  "/studio/theme",
  "/studio/modules",
  "/studio/options",
  "/studio/checkout",
];

function StudioStepsLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("StudioLayout");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPrice = useOrderStore(selectTotalPrice);
  const plan = useOrderStore((s) => s.plan);
  const theme = useOrderStore((s) => s.theme);
  const modules = useOrderStore((s) => s.modules);
  const weddingInfo = useOrderStore((s) => s.weddingInfo);
  const emailExists = useOrderStore((s) => s.emailExists);
  const hasHydrated = useOrderStore((s) => s._hasHydrated);

  const [menuOpen, setMenuOpen] = useState(false);
  // Checkout is the one long step in the funnel (summary + Stripe form), so
  // the nav scrolls out of reach there. Reveal a floating copy of it on any
  // upward scroll rather than pinning it permanently, which would eat vertical
  // room on mobile right where the payment fields need it.
  const headerRevealed = useHeaderReveal(180);

  const currentStepIndex = STEPS.findIndex((step) => pathname.includes(step));
  const nextStep = STEPS[currentStepIndex + 1] ?? STEPS[STEPS.length - 1];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const isStartValid =
    !!plan &&
    !!(weddingInfo?.partner1 ?? "").trim() &&
    !!(weddingInfo?.partner2 ?? "").trim() &&
    !!weddingInfo?.day &&
    !!weddingInfo?.month &&
    !!weddingInfo?.year &&
    !!(weddingInfo?.venue ?? "").trim() &&
    !!(weddingInfo?.email ?? "").trim() &&
    !emailExists;

  // Only the metered plan has to reach the included allowance before moving
  // on; the unlimited ones can continue with any selection.
  const isModulesValid =
    !hasMeteredModules(plan) || (modules ?? []).length >= FREE_MODULES_LIMIT;

  const isStepValid = pathname.includes("/studio/theme")
    ? !!theme
    : pathname.includes("/studio/modules")
      ? isModulesValid
      : true; // options + checkout are always passable

  // Guard: send the user back to the furthest valid step if they jump ahead
  // via the URL. Waits for the persisted store so we don't redirect on a
  // not-yet-rehydrated (empty) state.
  useEffect(() => {
    if (!hasHydrated) return;
    if (searchParams.get("payment_success")) return;

    if (currentStepIndex >= 1 && !isStartValid) {
      router.push("/studio/start");
    } else if (currentStepIndex >= 2 && !theme) {
      router.push("/studio/theme");
    } else if (currentStepIndex >= 3 && !isModulesValid) {
      router.push("/studio/modules");
    }
  }, [
    hasHydrated,
    currentStepIndex,
    isStartValid,
    theme,
    isModulesValid,
    router,
    searchParams,
  ]);

  return (
    <div className="relative flex min-h-screen flex-col bg-studio-beurre">
      {/* Floating twin of the inline nav below, hidden until the visitor
          scrolls back up. Two separate capsules rather than the inline nav's
          single full-width bar: overlaying content, a bar reads as a heavy
          band across the page, while corner pills leave the middle clear. */}
      <div
        // `inert` while hidden: a translated-away header still holds its place
        // in the tab order otherwise, so the first Tab lands on an invisible
        // menu button.
        inert={!headerRevealed ? true : undefined}
        aria-hidden={!headerRevealed}
        // Opacity only on the row: animating its transform moved the buttons
        // mid-reveal, so a click during the fade missed them entirely. The
        // pills below carry the slide instead.
        className={cn(
          "fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-4xl items-center justify-between px-5 pt-4 transition-opacity duration-200 ease-out",
          headerRevealed ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          className={cn(
            "flex h-11 items-center rounded-full bg-white px-4 shadow-[0_2px_12px_rgba(75,63,114,0.12)] transition-transform duration-200 ease-out",
            headerRevealed ? "translate-y-0" : "-translate-y-3",
          )}
        >
          <Image
            src="/logo-violet.svg"
            alt="The Studio Digital Papeterie"
            width={32}
            height={34}
            className="h-[34px] w-auto"
          />
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={t("menuAriaLabel")}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-[0_2px_12px_rgba(75,63,114,0.12)] transition-transform duration-200 ease-out hover:scale-105 active:scale-95",
            headerRevealed ? "translate-y-0" : "-translate-y-3",
          )}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-4xl px-5 pt-6">
        {/* Same pill nav as /studio/start */}
        <nav className="flex w-full items-center justify-between rounded-full bg-white px-5 py-3 shadow-[0_2px_12px_rgba(75,63,114,0.06)]">
          <Image
            src="/logo-violet.svg"
            alt="The Studio Digital Papeterie"
            width={40}
            height={42}
          />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menuAriaLabel")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          hideCreateButton
        />

        {/* Progress dots */}
        <div className="mt-8 flex flex-col items-center">
          <div className="flex items-center gap-[5px]">
            {STEPS.map((step, i) => {
              const isDone = i < currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <motion.div
                  key={step}
                  animate={{
                    width: isCurrent ? 18 : 6,
                    opacity: isDone || isCurrent ? 1 : 0.25,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={cn(
                    "h-[6px] rounded-full",
                    isDone || isCurrent
                      ? "bg-studio-violet"
                      : "bg-studio-lavande",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-8">
        {children}

        {/* Navigation, in the flow like the /start CTA.
            Checkout drives its own flow through the Stripe pay button. */}
        <div
          className={cn(
            "mt-10 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center",
            isLastStep && "hidden",
          )}
        >
          {currentStepIndex > 0 && (
            <Button
              variant="studio-outline"
              size="pill"
              onClick={() => router.push(STEPS[currentStepIndex - 1])}
              className="w-full border-studio-lavande text-studio-violet hover:bg-studio-lavande/10 sm:w-auto"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          )}
          <Button
            variant="studio-violet"
            size="pill"
            disabled={!isStepValid}
            onClick={() => router.push(nextStep)}
            className="w-full sm:w-auto"
          >
            {totalPrice}€ - {isLastStep ? t("finish") : t("continue")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function StudioStepsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <React.Suspense fallback={null}>
      <StudioStepsLayoutInner>{children}</StudioStepsLayoutInner>
    </React.Suspense>
  );
}

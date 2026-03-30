"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/navigation";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const STEPS = [
  "/studio/start",
  "/studio/animation",
  "/studio/theme",
  "/studio/modules",
  "/studio/options",
  "/studio/checkout",
];

const STEP_TITLES: Record<string, string> = {
  "/studio/start":     "Votre Mariage",
  "/studio/animation": "Animation d'entrée",
  "/studio/theme":     "Design & Thème",
  "/studio/modules":   "Fonctionnalités",
  "/studio/options":   "Options & Extras",
  "/studio/checkout":  "Récapitulatif",
};

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPrice = useOrderStore(selectTotalPrice);
  const plan = useOrderStore((state) => state.plan);
  const animation = useOrderStore((state) => state.animation);
  const theme = useOrderStore((state) => state.theme);
  const modules = useOrderStore((state) => state.modules);
  const weddingInfo = useOrderStore((state) => state.weddingInfo);
  const emailExists = useOrderStore((state) => state.emailExists);
  const resetStore = useOrderStore((state) => state.resetStore);
  const [isMounted, setIsMounted] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentStepIndex = STEPS.findIndex((step) => pathname.includes(step));

  const nextStep = STEPS[currentStepIndex + 1] || STEPS[STEPS.length - 1];
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const isStartValid =
    !!plan &&
    !!weddingInfo.partner1.trim() &&
    !!weddingInfo.partner2.trim() &&
    !!weddingInfo.day &&
    !!weddingInfo.month &&
    !!weddingInfo.year &&
    !!weddingInfo.venue.trim() &&
    !!weddingInfo.email.trim() &&
    weddingInfo.password.length >= 8 &&
    !emailExists;

  const isModulesValid = plan === "premium" || modules.length >= 4;

  const isStepValid =
    pathname.includes("/studio/start")     ? isStartValid :
    pathname.includes("/studio/animation") ? !!animation :
    pathname.includes("/studio/theme")     ? !!theme :
    pathname.includes("/studio/modules")   ? isModulesValid :
    true; // options + checkout toujours franchissables

  // Guard: redirect to the furthest valid step if the user jumps ahead via URL
  useEffect(() => {
    if (!isMounted) return;
    if (searchParams.get("payment_success")) return;

    if (currentStepIndex >= 1 && !isStartValid) {
      router.push("/studio/start");
    } else if (currentStepIndex >= 2 && !animation) {
      router.push("/studio/animation");
    } else if (currentStepIndex >= 3 && !theme) {
      router.push("/studio/theme");
    } else if (currentStepIndex >= 4 && !isModulesValid) {
      router.push("/studio/modules");
    }
  }, [isMounted, currentStepIndex, isStartValid, animation, theme, isModulesValid, router, searchParams]);

  const handleQuit = () => {
    setShowQuitDialog(true);
  };

  return (
    <div className='min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden'>
      {/* Background Noise Texture */}
      <div className='fixed inset-0 pointer-events-none z-0 mix-blend-overlay bg-noise opacity-50' />

      {/* HEADER */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 h-14'>
        <div className='container mx-auto h-full px-4 flex items-center justify-between relative'>
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/images/logo-the-studio-rectangulaire.svg'
            alt='The Studio'
            className='h-8 w-auto'
          />

          {/* Center: title + dots */}
          <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center'>
            <span className='font-heading font-bold text-[15px] leading-none text-foreground block mb-1.5'>
              {STEP_TITLES[pathname] || "Configuration"}
            </span>
            {/* Dots progress */}
            <div className='flex items-center justify-center gap-[5px]'>
              {STEPS.map((_, i) => {
                const isCompleted = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <motion.div
                    key={i}
                    animate={{
                      width: isCurrent ? 18 : 6,
                      opacity: isCompleted ? 1 : isCurrent ? 1 : 0.25,
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={cn(
                      "h-[6px] rounded-full",
                      isCompleted || isCurrent
                        ? "bg-primary"
                        : "bg-muted-foreground",
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Quit button */}
          <button
            onClick={handleQuit}
            className='text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2 px-1'
          >
            Quitter
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className='flex-1 container mx-auto px-4 pt-20 pb-32 z-10 max-w-4xl relative'>
        {children}
      </main>

      {/* STICKY FOOTER */}
      <div className='fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:pb-4 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'>
        <div className='container mx-auto max-w-4xl flex items-center justify-between'>
          {/* Price */}
          <div className='flex flex-col'>
            <span className='text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider'>
              {plan ? "Total estimé" : "À partir de"}
            </span>
            <div className='flex items-baseline gap-1'>
              <motion.span
                key={totalPrice}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className='font-heading text-2xl font-bold text-primary'
              >
                {plan ? `${totalPrice}€` : "175€"}
              </motion.span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className='flex items-center gap-2'>
            {currentStepIndex > 0 && (
              <button
                onClick={() => router.push(STEPS[currentStepIndex - 1])}
                className='flex items-center gap-1.5 rounded-full border-2 border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:border-foreground hover:text-foreground active:scale-95'
              >
                <ChevronLeft className='w-4 h-4' />
                <span className='hidden sm:inline'>Retour</span>
              </button>
            )}
            {!isLastStep && (
              <button
                onClick={() => router.push(nextStep)}
                disabled={!isStepValid}
                className={cn(
                  "group flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95",
                  !isStepValid && "opacity-40 cursor-not-allowed pointer-events-none",
                )}
              >
                <span>{isFirstStep ? "Commencer" : "Continuer"}</span>
                <ArrowRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QUIT CONFIRMATION DIALOG */}
      {showQuitDialog && (
        <div
          className='fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4'
          onClick={() => setShowQuitDialog(false)}
        >
          {/* Backdrop */}
          <motion.div
            className='absolute inset-0 bg-black/40 backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          {/* Dialog */}
          <motion.div
            className='relative w-full max-w-sm bg-background rounded-2xl overflow-hidden shadow-2xl border border-border/60'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className='px-6 py-7 text-center'>
              <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4'>
                <AlertTriangle className='w-5 h-5 text-primary' />
              </div>
              <p className='font-heading text-[17px] font-bold text-foreground mb-2'>
                Abandonner la création ?
              </p>
              <p className='text-sm text-muted-foreground leading-relaxed font-sans'>
                Votre progression sera perdue si vous quittez maintenant.
              </p>
            </div>
            <div className='flex border-t border-border/60'>
              <button
                onClick={() => setShowQuitDialog(false)}
                className='flex-1 py-4 text-sm font-semibold text-primary border-r border-border/60 hover:bg-primary/5 transition-colors'
              >
                Continuer
              </button>
              <button
                onClick={() => {
                  router.push("/");
                  resetStore();
                }}
                className='flex-1 py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
              >
                Quitter
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

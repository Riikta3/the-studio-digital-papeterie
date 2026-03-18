"use client";

import { cn } from "@/lib/utils";
import { Link, usePathname, useRouter } from "@/navigation";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, X } from "lucide-react";
import React, { useEffect } from "react";

const STEPS = [
  "/create/plan",
  "/create/animation",
  "/create/theme",
  "/create/modules",
  "/create/languages",
  "/create/extras",
  "/create/wedding",
  "/create/checkout",
];

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const totalPrice = useOrderStore(selectTotalPrice);
  const plan = useOrderStore((state) => state.plan);

  // Calculate Progress
  const currentStepIndex = STEPS.findIndex((step) => pathname.includes(step));
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Determine Next Step
  const nextStep = STEPS[currentStepIndex + 1] || STEPS[STEPS.length - 1];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const STEP_TITLES: Record<string, string> = {
    "/create/plan":      "Votre Offre",
    "/create/animation": "Animation d'entrée",
    "/create/theme":     "Design & Thème",
    "/create/modules":   "Fonctionnalités",
    "/create/languages": "Langues",
    "/create/extras":    "Options & Extras",
    "/create/wedding":   "Votre Mariage",
    "/create/checkout":  "Récapitulatif",
  };

  // Validate Navigation (Prevent skipping steps)
  useEffect(() => {
    if (currentStepIndex > 0 && !plan) {
      router.push("/create/plan");
    }
  }, [currentStepIndex, plan, router]);

  return (
    <div className='min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden'>
      {/* Background Noise Texture */}
      <div className='fixed inset-0 pointer-events-none z-0 mix-blend-overlay bg-noise opacity-50' />

      {/* HEADER */}
      <header className='fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40 h-16'>
        <div className='container mx-auto h-full px-4 flex items-center justify-between relative'>
          {/* Back Button (Mobile/Desktop) */}
          <button
            onClick={() => router.back()}
            className='p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>

          {/* Logo Centered */}
          <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center'>
            <span className='text-[10px] text-muted-foreground uppercase tracking-widest block mb-0.5 font-medium'>
              Étape {currentStepIndex + 1}/{STEPS.length}
            </span>
            <span className='font-heading font-bold text-lg leading-none text-foreground'>
              {STEP_TITLES[pathname] || "Configuration"}
            </span>
          </div>

          {/* Close Button */}
          <Link
            href='/'
            className='p-2 -mr-2 text-muted-foreground hover:text-red-500 transition-colors'
          >
            <X className='w-5 h-5' />
          </Link>
        </div>

        {/* Progress Bar */}
        <div className='absolute bottom-0 left-0 w-full h-[2px] bg-muted'>
          <motion.div
            className='h-full bg-primary'
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className='flex-1 container mx-auto px-4 pt-24 pb-32 z-10 max-w-4xl relative'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className='h-full'
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* STICKY FOOTER */}
      <div className='fixed bottom-0 left-0 right-0 z-50 p-4 pb-8 md:pb-4 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'>
        <div className='container mx-auto max-w-4xl flex items-center justify-between'>
          <div className='flex flex-col'>
            <span className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
              Total estimé
            </span>
            <div className='flex items-baseline gap-1'>
              <motion.span
                key={totalPrice}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='font-heading text-2xl font-bold text-primary'
              >
                {totalPrice}€
              </motion.span>
              {plan === "experience" && (
                <span className='text-xs text-muted-foreground hidden sm:inline-block'>
                  + modules extras
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push(nextStep)}
            disabled={currentStepIndex === 0 && !plan}
            className={cn(
              'group flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 font-semibold shadow-lg transition-all hover:scale-105 active:scale-95',
              currentStepIndex === 0 && !plan && 'opacity-40 cursor-not-allowed pointer-events-none',
            )}
          >
            <span>{isLastStep ? "Finaliser" : "Continuer"}</span>
            <ArrowRight className='w-4 h-4 transition-transform group-hover:translate-x-1' />
          </button>
        </div>
      </div>
    </div>
  );
}

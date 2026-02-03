"use client";

import { ScratchReveal } from "@/components/ui/scratch-reveal";
import { useRouter } from "@/navigation";
import { selectTotalPrice, useOrderStore } from "@/stores/use-order-store";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CreditCard, Edit2, Eye, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function CheckoutPage() {
  const { plan, theme, modules } = useOrderStore();
  const totalPrice = useOrderStore(selectTotalPrice);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Helper to format currency
  const formatPrice = (p: number) => `${p}€`;

  // Dynamic Guest Name
  const guestName = searchParams.get("guest");

  return (
    <div className='flex flex-col gap-8 pb-32'>
      <div className='text-center space-y-4'>
        <h1 className='font-heading text-4xl font-bold md:text-5xl'>
          Récapitulatif &{" "}
          <span className='italic text-primary'>Finalisation</span>
        </h1>
        <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
          Vérifiez vos choix avant de valider votre commande.
        </p>
      </div>

      <div className='grid gap-8 md:grid-cols-3'>
        {/* LEFT: ORDER SUMMARY */}
        <div className='md:col-span-2 space-y-6'>
          {/* 1. PLAN */}
          <div className='bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-start justify-between group hover:border-primary/20 transition-colors'>
            <div>
              <h3 className='font-heading text-xl font-bold mb-1'>
                Votre Offre
              </h3>
              <p className='text-muted-foreground capitalize'>
                Pack {plan || "Expérience"}
              </p>
              <ul className='mt-2 space-y-1 text-sm text-muted-foreground/80'>
                <li className='flex items-center gap-2'>
                  <Check className='w-3 h-3 text-primary' />
                  {plan === "premium" ? "Tout illimité" : "L'essentiel inclus"}
                </li>
              </ul>
            </div>
            <button
              onClick={() => router.push("/create/plan")}
              className='p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors'
              title='Modifier le plan'
            >
              <Edit2 className='w-4 h-4' />
            </button>
          </div>

          {/* 2. THEME */}
          <div className='bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-start justify-between group hover:border-primary/20 transition-colors'>
            <div>
              <h3 className='font-heading text-xl font-bold mb-1'>Design</h3>
              <div className='flex items-center gap-3'>
                <div className='w-6 h-6 rounded-full bg-primary/20' />
                <p className='text-muted-foreground capitalize'>
                  {theme?.replace("theme-", "") || "Non sélectionné"}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/create/theme")}
              className='p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors'
              title='Modifier le thème'
            >
              <Edit2 className='w-4 h-4' />
            </button>
          </div>

          {/* 3. MODULES & EXTRAS */}
          <div className='bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex items-start justify-between group hover:border-primary/20 transition-colors'>
            <div>
              <h3 className='font-heading text-xl font-bold mb-1'>Options</h3>
              <p className='text-muted-foreground'>
                Modules inclus par défaut ({modules.length})
              </p>
            </div>
            <button
              onClick={() => router.push("/create/modules")}
              className='p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors'
              title='Modifier les options'
            >
              <Edit2 className='w-4 h-4' />
            </button>
          </div>
        </div>

        {/* RIGHT: TOTAL & ACTIONS */}
        <div className='md:col-span-1 space-y-6'>
          <div className='bg-card border border-border rounded-3xl p-6 shadow-lg sticky top-24'>
            <h3 className='font-heading text-2xl font-bold mb-6'>Total</h3>

            <div className='flex justify-between items-end mb-2'>
              <span className='text-muted-foreground'>Montant à régler</span>
              <span className='font-heading text-4xl font-bold text-primary'>
                {formatPrice(totalPrice)}
              </span>
            </div>
            <p className='text-xs text-muted-foreground mb-8 text-right'>
              Paiement unique, accès à vie.
            </p>

            <div className='space-y-3'>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className='w-full flex items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-background py-3 text-sm font-semibold text-foreground hover:bg-muted transition-all active:scale-95'
              >
                <Eye className='w-4 h-4' />
                Voir l'aperçu
              </button>

              <button className='w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-semibold text-primary-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all'>
                <CreditCard className='w-4 h-4' />
                Payer {formatPrice(totalPrice)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8'>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className='absolute inset-0 bg-background/80 backdrop-blur-md'
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className='relative w-full max-w-4xl max-h-full overflow-hidden rounded-3xl border border-border bg-card shadow-2xl flex flex-col'
            >
              {/* Toolbar */}
              <div className='flex items-center justify-between border-b border-border p-4 bg-muted/30'>
                <div className='flex items-center gap-2'>
                  <Sparkles className='w-5 h-5 text-primary' />
                  <span className='font-heading font-bold'>Aperçu Direct</span>
                </div>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className='rounded-full p-2 hover:bg-muted transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              {/* Fake Phone/Web Preview */}
              <div className='flex-1 overflow-y-auto bg-muted/10 p-8 flex justify-center'>
                <div className='w-[375px] h-[667px] bg-white rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden relative'>
                  <div className='absolute top-0 w-full h-full flex flex-col items-center justify-center text-center p-6 space-y-6'>
                    <span className='text-xs uppercase tracking-widest text-gray-400'>
                      {theme?.replace("theme-", "") || "Nom du Thème"}
                    </span>

                    {/* Dynamic Guest Name */}
                    <p className='text-lg font-medium text-gray-600 animate-in fade-in slide-in-from-bottom-2'>
                      {guestName ? `Bonjour ${guestName},` : "Cher invité,"}
                    </p>

                    <h1 className='font-heading text-4xl text-gray-800'>
                      Sophie & Marc
                    </h1>

                    {/* Scratch Reveal for Date */}
                    <div className='relative'>
                      <ScratchReveal
                        width={250}
                        height={60}
                        minScratchPercentage={40}
                        className='mx-auto rounded-xl overflow-hidden shadow-sm'
                        onRevealComplete={() => console.log("Date Revealed!")}
                      >
                        <div className='flex items-center justify-center w-full h-full bg-white text-primary font-bold text-xl border border-primary/20'>
                          24 Août 2026
                        </div>
                      </ScratchReveal>
                    </div>

                    <div className='w-16 h-[1px] bg-gray-300' />
                    <p className='text-sm text-gray-600'>
                      Ceci est un aperçu simplifié. Votre site sera entièrement
                      interactif une fois créé.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

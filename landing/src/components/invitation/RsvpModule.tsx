"use client";

import { motion } from "framer-motion";
import { Send } from "lucide-react";

export function RsvpModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='bg-primary/5 rounded-[3rem] p-8 md:p-16 border border-primary/10'>
        <div className='text-center mb-12 space-y-4'>
          <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
            Présence
          </h2>
          <h3 className='font-heading text-5xl md:text-6xl italic'>RSVP</h3>
          <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
            Nous espérons vous compter parmi nous. Merci de confirmer votre
            présence avant le 1er Juin.
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='max-w-xl mx-auto bg-background p-8 rounded-3xl shadow-2xl shadow-primary/5 space-y-6'
        >
          <div className='space-y-4'>
            <div className='space-y-2'>
              <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Prénom & Nom
              </label>
              <input
                type='text'
                placeholder='Votre nom complet'
                className='w-full px-4 py-3 rounded-xl border border-border bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Serez-vous présent(e) ?
              </label>
              <div className='grid grid-cols-2 gap-4'>
                <button
                  type='button'
                  className='px-4 py-3 rounded-xl border border-primary bg-primary/5 font-bold text-primary transition-colors text-sm'
                >
                  Oui, avec joie !
                </button>
                <button
                  type='button'
                  className='px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors text-sm text-foreground/70 font-medium'
                >
                  Non, désolé
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Régime Alimentaire
              </label>
              <input
                type='text'
                placeholder='Allergies, végétarien, etc.'
                className='w-full px-4 py-3 rounded-xl border border-border bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all'
              />
            </div>
          </div>

          <button
            type='button'
            className='w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2'
          >
            Confirmer <Send className='w-4 h-4' />
          </button>
        </motion.form>
      </div>
    </section>
  );
}

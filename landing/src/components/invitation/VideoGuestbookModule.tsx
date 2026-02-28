"use client";

import { motion } from "framer-motion";
import { Camera, Heart, Video } from "lucide-react";

export function VideoGuestbookModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Souvenir Inoubliable
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>
          Livre d'Or Vidéo
        </h3>
      </div>

      <div className='max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center bg-primary/5 rounded-[3rem] border border-primary/20 overflow-hidden'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='p-8 md:p-12 space-y-6'
        >
          <div className='w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-lg border border-border/50'>
            <Video className='w-8 h-8 text-primary' />
          </div>
          <h4 className='font-heading text-4xl'>
            Laissez-nous un message vidéo !
          </h4>
          <p className='text-muted-foreground leading-relaxed'>
            Plutôt qu'un texte, pourquoi ne pas nous enregistrer un petit mot
            sympa, une anecdote ou vos vœux directement depuis votre smartphone
            ?
          </p>

          <div className='space-y-4 pt-4'>
            <div className='flex items-center gap-3 text-sm font-medium'>
              <span className='w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs'>
                1
              </span>
              Cliquez sur le bouton pour ouvrir la caméra
            </div>
            <div className='flex items-center gap-3 text-sm font-medium'>
              <span className='w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs'>
                2
              </span>
              Enregistrez votre message
            </div>
            <div className='flex items-center gap-3 text-sm font-medium'>
              <span className='w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs'>
                3
              </span>
              Validez <Heart className='inline w-4 h-4 text-primary ml-1' />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className='h-full bg-background border-l border-primary/10 flex flex-col items-center justify-center text-center p-12 min-h-[400px]'
        >
          <div className='w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative animate-pulse'>
            <Camera className='w-10 h-10 text-primary' />
            <div className='absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full border-4 border-background' />
          </div>
          <button className='px-8 py-5 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-transform'>
            Enregistrer mon message
          </button>
          <p className='text-xs text-muted-foreground mt-6 uppercase tracking-widest font-bold'>
            00:00 / 02:00
          </p>
        </motion.div>
      </div>
    </section>
  );
}

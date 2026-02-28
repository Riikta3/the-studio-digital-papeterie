"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ExternalLink, Gift } from "lucide-react";

export function GiftListModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Cadeaux
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>
          Liste de Mariage
        </h3>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className='max-w-xl mx-auto bg-muted/30 rounded-[3rem] p-8 md:p-12 text-center border border-border/50 hover:border-primary/20 transition-colors'
      >
        <div className='w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-lg mx-auto mb-8 border border-border/50'>
          <Gift className='w-10 h-10 text-primary' />
        </div>
        <p className='text-muted-foreground text-lg leading-relaxed mb-8'>
          Votre présence est notre plus beau cadeau. Si vous souhaitez néanmoins
          participer à notre lune de miel ou notre nouvelle vie, une urne sera à
          votre disposition le jour J, ou vous pouvez utiliser notre cagnotte en
          ligne.
        </p>
        <Link
          href='#'
          target='_blank'
          className='inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-transform'
        >
          Contribuer en ligne <ExternalLink className='w-4 h-4' />
        </Link>
      </motion.div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";

export function GenericInfoModule({
  weddingId,
  title,
  id,
}: {
  weddingId: string;
  title: string;
  id: string;
}) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Information
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>{title}</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className='max-w-2xl mx-auto bg-background rounded-3xl p-8 shadow-xl shadow-black/5 flex gap-6 items-start border border-border/50'
      >
        <div className='w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center shrink-0'>
          <Info className='w-6 h-6 text-primary' />
        </div>
        <div className='space-y-2'>
          <h4 className='font-heading text-2xl'>Détails à venir</h4>
          <p className='text-muted-foreground leading-relaxed'>
            Les informations détaillées pour la section <strong>{title}</strong>{" "}
            ({id}) seront mises à jour prochainement par les mariés.
          </p>
        </div>
      </motion.div>
    </section>
  );
}

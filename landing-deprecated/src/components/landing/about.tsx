"use client";

import { motion } from "framer-motion";

export function About() {
  return (
    <section
      id='a-propos'
      className='py-24 relative overflow-hidden'
    >
      {/* Decorative background elements */}
      <div className='absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2' />

      <div className='container mx-auto px-4'>
        <div className='grid md:grid-cols-2 gap-16 items-center'>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className='relative'
          >
            {/* Image Placeholder - styled as a photo frame */}
            <div className='aspect-[4/5] bg-muted rounded-lg overflow-hidden shadow-2xl rotate-3 border-8 border-card relative z-10'>
              <div
                className='absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105'
                style={{
                  backgroundImage: "url('/images/landing/about-team.png')",
                }}
              />
            </div>
            <div className='absolute -bottom-6 -left-6 aspect-[4/5] w-2/3 bg-muted/30 rounded-lg overflow-hidden shadow-xl -rotate-6 border-8 border-card z-0'>
              <div
                className='absolute inset-0 bg-cover bg-center'
                style={{
                  backgroundImage: "url('/images/landing/about-atelier.png')",
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className='space-y-6'
          >
            <h2 className='font-heading text-4xl font-bold'>
              Plus qu'un outil, <br />
              <span className='text-primary italic'>
                une passion pour l'élégance.
              </span>
            </h2>

            <p className='text-lg text-muted-foreground leading-relaxed'>
              The Studio Papeterie Digital est né d'un constat simple : les
              futurs mariés méritent mieux que des modèles de sites web rigides
              et impersonnels.
            </p>

            <p className='text-muted-foreground leading-relaxed'>
              Nous sommes une petite équipe de designers et développeurs basés à
              Paris, amoureux du papier texturé et de la typographie soignée.
              Notre mission est de transposer l'émotion d'un faire-part physique
              dans l'univers digital, sans perdre une once de magie.
            </p>

            <div className='pt-6 grid grid-cols-3 gap-8 border-t border-border'>
              <div>
                <span className='block font-heading text-3xl font-bold text-primary'>
                  2k+
                </span>
                <span className='text-sm text-muted-foreground'>
                  Mariages célébrés
                </span>
              </div>
              <div>
                <span className='block font-heading text-3xl font-bold text-primary'>
                  14
                </span>
                <span className='text-sm text-muted-foreground'>
                  Pays couverts
                </span>
              </div>
              <div>
                <span className='block font-heading text-3xl font-bold text-primary'>
                  5★
                </span>
                <span className='text-sm text-muted-foreground'>
                  Avis clients
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

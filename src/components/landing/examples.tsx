"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const examples = [
  {
    title: "Le Champêtre",
    theme: "theme-floral",
    color: "bg-[#FDFBF7]",
    image:
      "bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=600&auto=format&fit=crop')]",
    // Note: Using placeholder URL or a solid color for now as we don't have local images
  },
  {
    title: "Le Moderne",
    theme: "theme-modern",
    color: "bg-slate-50",
    image:
      "bg-[url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=600&auto=format&fit=crop')]",
  },
  {
    title: "Le Romantique",
    theme: "theme-boho",
    color: "bg-[#fff5f0]",
    image:
      "bg-[url('https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=600&auto=format&fit=crop')]",
  },
];

export function Examples() {
  return (
    <section
      id='modeles'
      className='py-24 bg-background'
    >
      <div className='container mx-auto px-4'>
        <div className='flex flex-col md:flex-row justify-between items-end mb-12 gap-6'>
          <div>
            <h2 className='font-heading text-3xl font-bold md:text-4xl mb-4'>
              Inspiration & <span className='text-primary italic'>Modèles</span>
            </h2>
            <p className='text-muted-foreground max-w-lg'>
              Découvrez nos thèmes soigneusement conçus. Chaque design est une
              base que vous pouvez personnaliser à l'infini.
            </p>
          </div>
          <Link
            href='/create/theme'
            className='hidden md:flex text-primary font-semibold hover:underline underline-offset-4 items-center gap-2'
          >
            Voir tous les thèmes <ArrowRight className='w-4 h-4' />
          </Link>
        </div>

        <div className='grid md:grid-cols-3 gap-8'>
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className='group cursor-pointer'
            >
              <div className='relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg border border-border mb-4'>
                {/* Fake Browser Header */}
                <div className='absolute top-0 inset-x-0 h-6 bg-card/90 backdrop-blur-sm z-10 border-b flex items-center px-3 gap-1'>
                  <div className='w-2 h-2 rounded-full bg-red-400' />
                  <div className='w-2 h-2 rounded-full bg-amber-400' />
                  <div className='w-2 h-2 rounded-full bg-green-400' />
                </div>

                {/* Preview Content (Placeholder) */}
                <div
                  className={cn(
                    "w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105",
                    ex.image,
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors",
                    )}
                  />
                  <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <span className='bg-card text-foreground px-6 py-2 rounded-full font-medium shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform'>
                      Voir la démo
                    </span>
                  </div>
                </div>
              </div>

              <h3 className='font-heading text-xl font-bold'>{ex.title}</h3>
            </motion.div>
          ))}
        </div>

        <div className='mt-8 text-center md:hidden'>
          <Link
            href='/create/theme'
            className='text-primary font-semibold hover:underline underline-offset-4 flex items-center gap-2 mx-auto justify-center'
          >
            Voir tous les thèmes <ArrowRight className='w-4 h-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}

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
    image: "bg-[url('/images/landing/theme-floral.png')]",
  },
  {
    title: "Le Voyage",
    theme: "theme-travel",
    color: "bg-slate-50",
    image: "bg-[url('/images/landing/theme-travel.png')]",
  },
  {
    title: "Le Romantique",
    theme: "theme-boho",
    color: "bg-[#fff5f0]",
    image: "bg-[url('/images/landing/theme-boho.png')]",
  },
];

export function Examples() {
  return (
    <section
      id='modeles'
      className='py-24 bg-background'
    >
      <div className='container mx-auto px-4'>
        {/* Centered Header */}
        <div className='mb-16 text-center max-w-3xl mx-auto'>
          <h2 className='font-heading text-4xl md:text-5xl font-medium text-foreground mb-6'>
            Pour chaque histoire, <br />
            <span className='text-primary italic'>un écrin unique.</span>
          </h2>
          <p className='text-lg text-muted-foreground font-body'>
            Nos designers ont créé des collections exclusives. Choisissez celle
            qui résonne avec votre âme.
          </p>
        </div>

        <div className='grid md:grid-cols-3 gap-12'>
          {examples.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className='group cursor-pointer flex flex-col items-center gap-6'
            >
              {/* Frame Style Card - No Browser Dots */}
              <div className='relative w-full aspect-[3/4] p-3 bg-white shadow-2xl transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]'>
                <div className='relative w-full h-full overflow-hidden'>
                  <div
                    className={cn(
                      "w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105",
                      ex.image,
                    )}
                  />
                  {/* Subtle Overlay */}
                  <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500' />
                </div>
              </div>

              {/* Title centered and elegant */}
              <div className='text-center space-y-2'>
                <h3 className='font-heading text-3xl font-medium italic text-foreground'>
                  {ex.title}
                </h3>
                <span className='text-xs uppercase tracking-widest text-muted-foreground border-b border-transparent group-hover:border-primary transition-colors pb-1'>
                  Découvrir ce thème
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className='mt-8 text-center md:hidden'>
          <Link
            href='/studio/theme'
            className='text-primary font-semibold hover:underline underline-offset-4 flex items-center gap-2 mx-auto justify-center'
          >
            Voir tous les thèmes <ArrowRight className='w-4 h-4' />
          </Link>
        </div>
      </div>
    </section>
  );
}

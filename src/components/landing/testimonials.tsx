"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    names: "Sarah & Thomas",
    date: "Mariés en Juin 2024",
    text: "Nos invités ont été bluffés par l'animation de l'enveloppe ! C'est le détail qui a tout changé. La gestion des RSVP nous a sauvé un temps précieux.",
    theme: "Theme Floral",
  },
  {
    names: "Élodie & Marc",
    date: "Mariés en Septembre 2024",
    text: "Enfin un site de mariage qui ne ressemble pas à un blog des années 2000. C'est chic, épuré et très facile à modifier. Le service client est adorable.",
    theme: "Theme Minimalist",
  },
  {
    names: "Juliette & Pierre",
    date: "Mariés en Août 2024",
    text: "Nous avions un mariage à l'étranger et la fonctionnalité multilingue était indispensable. Tout a fonctionné parfaitement. Merci !",
    theme: "Theme Royal",
  },
];

export function Testimonials() {
  return (
    <section
      id='temoignages'
      className='py-24 bg-background overflow-hidden relative'
    >
      <div className='container mx-auto px-4'>
        <div className='mb-16 text-center'>
          <h2 className='font-heading text-3xl font-bold md:text-4xl'>
            Ils ont dit <span className='text-primary italic'>Oui</span>
          </h2>
        </div>

        <div className='grid md:grid-cols-3 gap-8'>
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
              viewport={{ once: true }}
              className='bg-[#FDFBF7] p-10 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-border/30 relative flex flex-col items-center text-center group hover:translate-y-[-5px] transition-transform duration-300'
            >
              {/* Decorative Quote */}
              <div className='text-6xl font-serif text-primary/10 absolute top-4 left-6 leading-none'>
                "
              </div>

              <div className='flex-1 flex items-center'>
                <p className='font-heading text-2xl text-foreground/80 leading-relaxed italic'>
                  {t.text}
                </p>
              </div>

              <div className='mt-8 pt-6 border-t border-border/40 w-full'>
                <div className='flex flex-col items-center gap-2'>
                  <div className='flex gap-0.5 text-orange-400 mb-2'>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className='w-3 h-3 fill-current'
                      />
                    ))}
                  </div>
                  <h4 className='font-sans font-bold text-sm uppercase tracking-widest text-foreground'>
                    {t.names}
                  </h4>
                  <span className='text-xs text-muted-foreground font-medium'>
                    {t.date}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

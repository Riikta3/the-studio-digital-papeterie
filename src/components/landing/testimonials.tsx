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
      className='py-24 bg-primary/5'
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
              className='bg-card p-8 rounded-2xl shadow-sm border border-border/50 relative'
            >
              <div className='absolute -top-4 left-8 bg-primary text-primary-foreground px-3 py-1 text-xs rounded-full flex gap-1 items-center'>
                <Star className='w-3 h-3 fill-primary-foreground' /> 5.0
              </div>

              <p className='text-muted-foreground italic mb-6 leading-relaxed'>
                "{t.text}"
              </p>

              <div className='border-t border-border pt-4'>
                <h4 className='font-heading font-bold text-lg'>{t.names}</h4>
                <div className='flex justify-between items-center mt-1'>
                  <span className='text-xs text-muted-foreground uppercase tracking-wider'>
                    {t.date}
                  </span>
                  <span className='text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full'>
                    {t.theme}
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

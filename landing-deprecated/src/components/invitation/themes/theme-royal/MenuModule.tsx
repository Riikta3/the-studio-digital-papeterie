"use client";

import { motion } from "framer-motion";
import { Coffee, Utensils, Wine } from "lucide-react";

// --- Data Types ---
export interface MenuItem {
  title: string;
  description?: string;
}

export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface MenuData {
  sections: MenuSection[];
  dietaryNote?: string;
  footer: string[];
}

// --- Mock Data (To be replaced by DB later) ---
const MOCK_MENU: MenuData = {
  sections: [
    {
      id: "sec-1",
      title: "Pour commencer",
      items: [
        {
          title: "Velouté de butternut au lait de coco",
          description: "Éclats de châtaignes et huile de truffe",
        },
      ],
    },
    {
      id: "sec-2",
      title: "Le Plat",
      items: [
        {
          title: "Filet de bœuf Wellington",
          description:
            "Jus corsé au vin rouge, accompagné de sa mousseline de pommes de terre truffée et petits légumes glacés",
        },
      ],
    },
    {
      id: "sec-3",
      title: "La Note Sucrée",
      items: [
        {
          title: "Pièce montée traditionnelle",
        },
        {
          title: "Farandole de mignardises",
        },
      ],
    },
  ],
  dietaryNote:
    "Toutes nos viandes sont d'origine certifiée. En cas d'allergies, d'intolérances ou de régime spécifique (végétarien, halal, sans gluten), merci de le préciser lors de votre RSVP.",
  footer: ["Vins & Champagne inclus", "Café & Thé"],
};

export function MenuModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const menu: MenuData = {
    ...MOCK_MENU,
    ...config,
    sections: (config?.sections && Array.isArray(config.sections) && config.sections.length > 0)
      ? config.sections as MenuData["sections"]
      : MOCK_MENU.sections,
    footer: (config?.footer && Array.isArray(config.footer) && config.footer.length > 0)
      ? config.footer as string[]
      : MOCK_MENU.footer,
  };

  if (!menu || menu.sections.length === 0) return null;

  return (
    <section className='w-full'>
      <div className='text-center mb-20 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-[#c4a23a]'>
          Gastronomie
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>Le Menu</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-2xl mx-auto relative'
      >
        {/* Subtle decorative background frame */}
        <div className='absolute inset-0 bg-card/60 backdrop-blur-sm border border-primary/20 rounded-t-full rounded-b-[4rem] shadow-sm -z-10' />
        <div className='absolute inset-4 border border-primary/10 rounded-t-full rounded-b-[3.5rem] -z-10 pointer-events-none' />

        <div className='px-8 py-20 md:px-16 md:py-24 text-center'>
          <Utensils className='w-10 h-10 text-[#c4a23a] mx-auto mb-16 opacity-70 stroke-[1.5]' />

          <div className='space-y-16'>
            {menu.sections.map((section) => (
              <div
                key={section.id}
                className='group'
              >
                <h4 className='text-[10px] font-bold uppercase tracking-[0.3em] text-primary/70 mb-6 flex items-center justify-center gap-4'>
                  <span className='w-8 h-[1px] bg-primary/20'></span>
                  {section.title}
                  <span className='w-8 h-[1px] bg-primary/20'></span>
                </h4>

                <div className='space-y-8'>
                  {section.items.map((item, idx) => (
                    <div key={idx}>
                      <p className='font-heading text-3xl md:text-4xl text-[#1e3a8a]/90 transition-colors group-hover:text-primary leading-tight px-4 mb-2'>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className='italic text-[#1e3a8a]/60 font-light text-base md:text-lg max-w-sm mx-auto'>
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {menu.footer && menu.footer.length > 0 && (
            <div className='mt-20 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-center gap-6 text-xs tracking-widest uppercase text-muted-foreground/80 font-semibold'>
              {menu.footer.map((note, idx) => (
                <div
                  key={idx}
                  className='flex items-center gap-2'
                >
                  {idx === 0 ? (
                    <Wine className='w-4 h-4 text-primary/70' />
                  ) : (
                    <Coffee className='w-4 h-4 text-primary/70' />
                  )}
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}

          {/* DYNAMIC DIETARY/ALLERGY NOTES */}
          {menu.dietaryNote && (
            <div className='mt-20 mx-auto max-w-lg p-8 bg-card/40 rounded-2xl border border-primary/10 shadow-sm'>
              <h4 className='text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80 mb-4'>
                Note du Chef / Régimes Spéciaux
              </h4>
              <p className='text-sm font-light text-muted-foreground/90 italic leading-relaxed'>
                {menu.dietaryNote}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

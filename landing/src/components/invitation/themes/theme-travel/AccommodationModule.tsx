"use client";

import { Button } from "@shared/components/ui/button";
import { motion } from "framer-motion";
import {
  BedDouble,
  ExternalLink,
  Home,
  Hotel,
  MapPin,
  TentTree,
} from "lucide-react";
import { ModuleIconCircle } from "@/components/invitation/ModuleIconCircle";

export type AccommodationType = "Hotel" | "House" | "Camping" | "Other";

export interface AccommodationOption {
  id: string;
  type: AccommodationType;
  name: string;
  distance: string;
  description: string;
  url?: string;
  urlLabel?: string;
}

export interface AccommodationData {
  title: string;
  subtitle: string;
  description: string;
  options: AccommodationOption[];
}

const MOCK_ACCOMMODATIONS: AccommodationData = {
  title: "Logements",
  subtitle: "Où dormir ?",
  description:
    "Pour profiter pleinement de la fête en toute sérénité, voici nos suggestions d'hébergements à proximité du domaine.",
  options: [
    {
      id: "1",
      type: "Hotel",
      name: "Ibis Melun",
      distance: "À 15 minutes du domaine",
      description:
        "Hôtel confortable idéalement situé à Melun, avec navette disponible sur demande pour rejoindre le château.",
      url: "https://all.accor.com",
      urlLabel: "Réserver une chambre",
    },
    {
      id: "2",
      type: "House",
      name: "Gîte de Maincy",
      distance: "À 5 minutes (village voisin)",
      description:
        "Idéal pour les familles ou groupes d'amis. Gîte spacieux avec 4 chambres au cœur du village de Maincy.",
      url: "https://airbnb.com",
      urlLabel: "Voir sur Airbnb",
    },
    {
      id: "3",
      type: "Hotel",
      name: "Hôtel de la Brie",
      distance: "À 20 minutes",
      description:
        "Nous avons pré-réservé quelques chambres pour nos invités. Contactez-nous rapidement pour bloquer la vôtre.",
    },
  ],
};

function getIcon(type: AccommodationType) {
  switch (type) {
    case "Hotel":
      return <Hotel className='w-5 h-5' />;
    case "House":
      return <Home className='w-5 h-5' />;
    case "Camping":
      return <TentTree className='w-5 h-5' />;
    default:
      return <BedDouble className='w-5 h-5' />;
  }
}

export function AccommodationModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const data: AccommodationData = {
    ...MOCK_ACCOMMODATIONS,
    ...(config ? Object.fromEntries(Object.entries(config).filter(([, v]) => v !== "" && v !== null && v !== undefined)) : {}),
    options: (config?.options && Array.isArray(config.options) && config.options.length > 0)
      ? config.options as AccommodationData["options"]
      : MOCK_ACCOMMODATIONS.options,
  };

  if (!data.options || data.options.length === 0) return null;

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-5xl mx-auto px-4'
      >
        <div className='text-center mb-16 space-y-4'>
          <h2 className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-foreground/60'>
            {data.title}
          </h2>
          <h3 className='font-heading text-5xl md:text-6xl italic text-foreground'>
            {data.subtitle}
          </h3>
          <p className='text-muted-foreground/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light'>
            {data.description}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8'>
          {data.options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className='bg-card rounded-[2rem] p-8 border border-primary/20 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] flex flex-col h-full group hover:border-primary/30 transition-colors'
            >
              <ModuleIconCircle size="md" className="mb-6 group-hover:border-primary/20 transition-colors">
                {getIcon(option.type)}
              </ModuleIconCircle>

              <h4 className='font-heading text-3xl text-foreground mb-3 leading-tight'>
                {option.name}
              </h4>

              <div className='flex items-center gap-2 text-[10px] md:text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-4'>
                <MapPin className='w-3.5 h-3.5 opacity-70' /> {option.distance}
              </div>

              <p className='text-muted-foreground/60 text-[14px] leading-relaxed font-light mb-8 flex-grow'>
                {option.description}
              </p>

              {option.url && (
                <div className='pt-2 mt-auto'>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full rounded-full h-auto py-3.5 px-4 whitespace-normal text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] border-primary/20 bg-card text-foreground/60 hover:bg-muted hover:text-primary hover:border-primary/30 transition-all gap-2'
                  >
                    <a
                      href={option.url}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <span>{option.urlLabel || "VOIR SUR LE SITE"}</span>
                      <ExternalLink className='w-3 h-3 opacity-60 flex-shrink-0' />
                    </a>
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

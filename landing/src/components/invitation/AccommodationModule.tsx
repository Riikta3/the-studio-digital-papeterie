"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ExternalLink, Hotel, MapPin } from "lucide-react";

const MOCK_HOTELS = [
  {
    id: 1,
    name: "Le Grand Chalet",
    distance: "À 5 minutes du domaine",
    desc: "Hôtel 4 étoiles avec vue panoramique.",
    link: "#",
  },
  {
    id: 2,
    name: "Les Colombes Airbnb",
    distance: "À 10 minutes (village voisin)",
    desc: "Idéal pour les familles ou groupes d'amis. 3 chambres.",
    link: "#",
  },
  {
    id: 3,
    name: "Auberge de la Forêt",
    distance: "Sur place",
    desc: "Quelques chambres réservées. Contactez-nous rapidement.",
    link: "#",
  },
];

export function AccommodationModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Logements
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>
          Où dormir ?
        </h3>
        <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
          Pour profiter pleinement de la fête en toute sécurité, voici nos
          suggestions d'hébergements à proximité du domaine.
        </p>
      </div>

      <div className='grid md:grid-cols-3 gap-6'>
        {MOCK_HOTELS.map((hotel, i) => (
          <motion.div
            key={hotel.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className='bg-background rounded-3xl p-8 border border-border/50 shadow-xl shadow-black/5 hover:border-primary/30 transition-colors flex flex-col h-full'
          >
            <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6'>
              <Hotel className='w-5 h-5 text-primary' />
            </div>
            <h4 className='font-heading text-2xl mb-2'>{hotel.name}</h4>
            <div className='flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4'>
              <MapPin className='w-3 h-3' /> {hotel.distance}
            </div>
            <p className='text-sm text-foreground/80 leading-relaxed flex-grow mb-8'>
              {hotel.desc}
            </p>
            <Link
              href={hotel.link}
              target='_blank'
              className='inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm font-bold'
            >
              Voir le site <ExternalLink className='w-3.5 h-3.5' />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

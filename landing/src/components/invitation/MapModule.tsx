"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { Car, MapPin, Navigation } from "lucide-react";

const MOCK_LOCATION = {
  name: "Château de la Roche",
  address: "123 Allée des Marronniers, 75000 Paris",
  description: "Un domaine enchanteur avec un grand parc privé.",
};

export function MapModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Lieu
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>Accès</h3>
      </div>

      <div className='grid md:grid-cols-2 gap-8 items-center bg-background rounded-[3rem] border border-border/50 p-4 md:p-8 shadow-xl shadow-primary/5'>
        {/* Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='relative w-full aspect-square md:aspect-auto md:h-full bg-muted/50 rounded-3xl overflow-hidden flex items-center justify-center border border-border'
        >
          <div className="absolute inset-0 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Paris&zoom=14&size=600x600&sensor=false')] bg-cover bg-center" />
          <div className='relative z-10 flex flex-col items-center gap-4 text-center p-6'>
            <div className='w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-lg text-primary'>
              <MapPin className='w-8 h-8' />
            </div>
            <p className='font-bold text-sm tracking-widest uppercase text-muted-foreground'>
              Google Maps Intégré
            </p>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='p-8 space-y-8'
        >
          <div className='space-y-4'>
            <h4 className='font-heading text-4xl'>{MOCK_LOCATION.name}</h4>
            <p className='text-muted-foreground leading-relaxed'>
              {MOCK_LOCATION.description}
            </p>
            <p className='font-bold text-foreground'>{MOCK_LOCATION.address}</p>
          </div>

          <div className='flex flex-col gap-4'>
            <Link
              href='#'
              target='_blank'
              className='w-full py-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors flex items-center justify-center gap-3 font-bold text-sm'
            >
              <Navigation className='w-4 h-4' />
              Ouvrir dans Google Maps
            </Link>
            <Link
              href='#'
              target='_blank'
              className='w-full py-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center justify-center gap-3 font-bold text-sm'
            >
              <Car className='w-4 h-4' />Y aller avec Waze
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

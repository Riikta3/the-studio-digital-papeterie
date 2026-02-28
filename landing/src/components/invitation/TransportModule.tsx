"use client";

import { motion } from "framer-motion";
import { Bus, Map, Plane, Train } from "lucide-react";

const MOCK_TRANSPORTS = [
  {
    id: 1,
    icon: Train,
    title: "En Train",
    desc: "Gare TGV la plus proche : Paris Montparnasse (à 45min en voiture du domaine).",
  },
  {
    id: 2,
    icon: Plane,
    title: "En Avion",
    desc: "Aéroport de Paris-Orly (ORY) situé à 1h15 du lieu de réception.",
  },
  {
    id: 3,
    icon: Bus,
    title: "Navettes Prévues",
    desc: "Des navettes feront l'aller-retour entre le centre-ville et le domaine à 2h00 et 4h00 du matin.",
  },
];

export function TransportModule({ weddingId }: { weddingId: string }) {
  return (
    <section className='w-full'>
      <div className='text-center mb-16 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-primary'>
          Logistique
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>
          Votre Trajet
        </h3>
        <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
          Voici toutes les informations pratiques pour nous rejoindre facilement
          le jour J.
        </p>
      </div>

      <div className='grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center'>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className='space-y-8'
        >
          {MOCK_TRANSPORTS.map((transport, i) => {
            const Icon = transport.icon;
            return (
              <div
                key={transport.id}
                className='flex gap-6 items-start bg-background p-6 rounded-3xl border border-border/50 hover:shadow-xl hover:shadow-black/5 transition-shadow'
              >
                <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0'>
                  <Icon className='w-6 h-6 text-primary' />
                </div>
                <div>
                  <h4 className='font-heading text-2xl mb-2'>
                    {transport.title}
                  </h4>
                  <p className='text-foreground/80 text-sm leading-relaxed'>
                    {transport.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className='relative aspect-square md:aspect-auto md:h-full bg-primary/5 rounded-[3rem] overflow-hidden flex flex-col justify-center items-center text-center p-12 border border-primary/20'
        >
          <Map className='w-20 h-20 text-primary mb-6 opacity-50' />
          <h4 className='font-heading text-3xl mb-4 text-primary'>
            Covoiturage
          </h4>
          <p className='text-sm text-foreground/80 leading-relaxed mb-8'>
            Pour limiter notre empreinte écologique et faciliter les trajets,
            nous avons mis en place un tableau de covoiturage.
          </p>
          <button className='px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-opacity'>
            Proposer ou chercher une place
          </button>
        </motion.div>
      </div>
    </section>
  );
}

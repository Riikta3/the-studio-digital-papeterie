"use client";

import { Button } from "@shared/components/ui/button";
import { motion } from "framer-motion";
import { Bus, Car, ExternalLink, Plane, Ship, Train } from "lucide-react";

export type TransportIconType = "Train" | "Plane" | "Bus" | "Car" | "Ship";

export interface TransportOption {
  id: string;
  iconType: TransportIconType;
  title: string;
  description: string;
}

export interface TransportData {
  options: TransportOption[];
  carpoolUrl?: string;
  carpoolLinkLabel?: string;
  carpoolDescription?: string;
}

const MOCK_TRANSPORT: TransportData = {
  options: [
    {
      id: "trans-1",
      iconType: "Train",
      title: "En Train",
      description:
        "Gare de Lyon → Melun en 35 min (Transilien R), puis taxi ou navette jusqu'au château (10 min).",
    },
    {
      id: "trans-2",
      iconType: "Car",
      title: "En Voiture",
      description:
        "Depuis Paris : A6 direction Lyon, sortie Melun/Vaux-le-Vicomte. Parking gratuit et surveillé sur place.",
    },
    {
      id: "trans-3",
      iconType: "Bus",
      title: "Navettes Prévues",
      description:
        "Des navettes privées feront l'aller-retour depuis Paris 8e et les hôtels partenaires à 2h00, 3h30 et 5h00 du matin.",
    },
  ],
  carpoolUrl: "https://togetzer.com/",
  carpoolLinkLabel: "Accéder au tableau",
  carpoolDescription:
    "Pour limiter notre empreinte écologique et faciliter les trajets, nous avons mis en place un tableau de covoiturage. N'hésitez pas à proposer ou chercher une place !",
};

const getIcon = (type: TransportIconType) => {
  switch (type) {
    case "Train":
      return <Train className='w-6 h-6 text-[#be185d]' strokeWidth={1.5} />;
    case "Plane":
      return <Plane className='w-6 h-6 text-[#be185d]' strokeWidth={1.5} />;
    case "Bus":
      return <Bus className='w-6 h-6 text-[#be185d]' strokeWidth={1.5} />;
    case "Car":
      return <Car className='w-6 h-6 text-[#be185d]' strokeWidth={1.5} />;
    case "Ship":
      return <Ship className='w-6 h-6 text-[#be185d]' strokeWidth={1.5} />;
    default:
      return <Car className='w-6 h-6 text-[#be185d]' strokeWidth={1.5} />;
  }
};

export function TransportModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const data: TransportData = {
    ...MOCK_TRANSPORT,
    ...(config ? Object.fromEntries(Object.entries(config).filter(([, v]) => v !== "" && v !== null && v !== undefined)) : {}),
    options: (config?.options && Array.isArray(config.options) && config.options.length > 0)
      ? config.options as TransportData["options"]
      : MOCK_TRANSPORT.options,
  };

  if (!data || (data.options.length === 0 && !data.carpoolUrl)) return null;

  return (
    <section className='w-full'>
      <div className='text-center mb-20 space-y-4'>
        <h2 className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#1a1a2e]/60'>
          Logistique
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#1a1a2e]'>
          Votre Trajet
        </h3>
      </div>

      <div className='grid md:grid-cols-12 gap-8 max-w-5xl mx-auto'>
        {/* Dynamic Transport Options List */}
        {data.options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`flex flex-col gap-6 ${data.carpoolUrl ? "md:col-span-7" : "col-span-12"}`}
          >
            {data.options.map((option) => (
              <div
                key={option.id}
                className='group flex flex-col sm:flex-row gap-8 items-start sm:items-center bg-white p-10 py-12 rounded-[2.5rem] border border-[#be185d]/20 shadow-xl hover:border-primary/30 transition-colors duration-300'
              >
                <div className='w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center shrink-0 border border-primary/10 transition-transform duration-500'>
                  {getIcon(option.iconType)}
                </div>
                <div className='flex flex-col justify-center'>
                  <h4 className='font-heading text-3xl text-[#1a1a2e] mb-3'>
                    {option.title}
                  </h4>
                  <p className='text-[#1a1a2e]/60 font-light text-[15px] leading-relaxed max-w-md'>
                    {option.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Dynamic Carpool Block */}
        {data.carpoolUrl && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className={`relative overflow-hidden bg-secondary rounded-[3rem] border border-[#be185d]/20 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.04)] flex flex-col items-center text-center p-12 lg:p-14 ${data.options.length > 0 ? "md:col-span-5" : "col-span-12 max-w-md mx-auto w-full"}`}
          >
            <div
              className='absolute inset-0 opacity-[0.15] pointer-events-none'
              style={{
                backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 41%, transparent 41%),
                                linear-gradient(-45deg, transparent 60%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.1) 61%, transparent 61%),
                                linear-gradient(0deg, transparent 70%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.1) 71%, transparent 71%)`,
                backgroundSize: "300px 300px",
                backgroundPosition: "center",
              }}
            />

            <div className='relative z-10 w-full flex flex-col items-center h-full'>
              <div className='w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#be185d]/20 mt-4 mb-10'>
                <Car className='w-7 h-7 text-[#be185d]' strokeWidth={1.5} />
              </div>

              <h4 className='font-heading text-4xl text-[#1a1a2e] mb-6'>
                Covoiturage
              </h4>

              <p className='text-[#1a1a2e]/60 font-light text-[15px] leading-relaxed mb-auto pb-12 max-w-[280px]'>
                {data.carpoolDescription}
              </p>

              <div className='w-full flex justify-center pb-2'>
                <Button
                  asChild
                  size='lg'
                  className='rounded-full h-auto py-3.5 px-8 whitespace-normal text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] border border-[#be185d]/20 bg-white text-[#1a1a2e]/60 hover:bg-muted hover:text-primary hover:border-primary/30 transition-all gap-2 shadow-sm'
                >
                  <a
                    href={data.carpoolUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <span>{data.carpoolLinkLabel || "ACCÉDER AU TABLEAU"}</span>
                    <ExternalLink className='w-3 h-3 opacity-60 flex-shrink-0' />
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

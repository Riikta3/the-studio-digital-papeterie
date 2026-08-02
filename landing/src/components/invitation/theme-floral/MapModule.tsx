"use client";

import { motion } from "framer-motion";
import { ExternalLink, MapPin, Navigation } from "lucide-react";

export interface LocationData {
  id?: string;
  name: string;
  address: string;
  description?: string;
  // Demo note: no `imageUrl` field here on purpose. The reference version
  // used a hardcoded Unsplash photo, which would require adding Unsplash to
  // `next.config.mjs` `remotePatterns` just for a mock asset. Instead this
  // demo renders a CSS gradient placeholder (see `hasVisual` below) so no
  // remote image / new binary asset is needed.
  hasVisual?: boolean;
  imageOrientation?: "portrait" | "landscape";
}

// Hardcoded demo venue — matches `INVITATION_DEMO.venue` ("Château des Roses").
const MOCK_LOCATION: LocationData = {
  name: "Château des Roses",
  address: "Allée des Roses, 77950 Maincy",
  description:
    "Un écrin de verdure au cœur de la campagne, à moins d'une heure de Paris. Stationnement gratuit sur place.",
  hasVisual: true,
  imageOrientation: "landscape",
};

export function MapModule() {
  const location: LocationData = MOCK_LOCATION;

  if (!location) return null;

  const isPortrait = location.hasVisual && location.imageOrientation === "portrait";

  // Shared gradient placeholder standing in for a real venue photo, using
  // the theme-floral palette (`#fdf6f0` -> `#c97a90`, see `studio/themes.ts`).
  const VisualPlaceholder = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-[#fdf6f0] via-[#f0d9cc] to-[#c97a90] flex items-center justify-center">
      <MapPin className="w-10 h-10 text-white/70" strokeWidth={1.25} />
    </div>
  );

  return (
    <section className='w-full'>
      <div className='text-center mb-20 space-y-4'>
        <h2 className='text-sm font-bold uppercase tracking-widest text-[#c97a90]'>
          Lieu de Réception
        </h2>
        <h3 className='font-heading text-5xl md:text-6xl italic'>Accès</h3>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-5xl mx-auto'
      >
        <div
          className={`relative overflow-hidden bg-card/60 backdrop-blur-sm rounded-[3rem] border border-primary/10 flex flex-col ${isPortrait ? "md:flex-row" : ""}`}
        >
          {/* Venue visual (portrait mode: left side) */}
          {isPortrait && (
            <div className='relative w-full md:w-5/12 aspect-[4/5] md:h-auto shrink-0'>
              <VisualPlaceholder />
              <div className='absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/90' />
            </div>
          )}

          {/* Venue visual (landscape banner mode: top) */}
          {location.hasVisual && !isPortrait && (
            <div className='relative w-full aspect-video md:aspect-[21/9] h-64 md:h-96 shrink-0'>
              <VisualPlaceholder />
              <div className='absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent' />
            </div>
          )}

          {/* Location content container */}
          <div
            className={`w-full p-10 md:p-14 flex flex-col gap-10 justify-between
              ${!location.hasVisual ? "text-center items-center" : isPortrait ? "flex-1 md:py-16" : "md:flex-row items-center"}
            `}
          >
            {/* Address details */}
            <div
              className={`space-y-6 flex-1 ${!location.hasVisual ? "flex flex-col items-center max-w-2xl mx-auto" : ""}`}
            >
              <h4 className='font-heading text-3xl md:text-5xl text-[#5a3040]/90 leading-tight'>
                {location.name}
              </h4>
              <p className='text-[#5a3040]/60 font-light text-base md:text-lg leading-relaxed'>
                {location.description}
              </p>

              <div
                className={`pt-8 border-t border-primary/10 w-full ${!location.hasVisual ? "flex flex-col items-center text-center" : ""}`}
              >
                <p
                  className={`font-bold text-[10px] tracking-[0.2em] uppercase text-primary/70 flex items-center gap-3 mb-3 ${!location.hasVisual ? "justify-center" : ""}`}
                >
                  <MapPin className='w-4 h-4 text-[#c97a90]' />
                  Adresse du domaine
                </p>
                <div
                  className={`text-[#5a3040]/90 text-base leading-relaxed ${!location.hasVisual ? "pl-0" : "pl-7"}`}
                >
                  {location.address.split(",").map((line, ix) => (
                    <span
                      key={ix}
                      className='block'
                    >
                      {line.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Map & actions */}
            <div
              className={`flex flex-col gap-6 w-full ${isPortrait || !location.hasVisual ? "max-w-md mx-auto" : "md:w-[320px] shrink-0 mt-8 md:mt-0"}`}
            >
              {/* Small embedded Google Map (no API key needed, `output=embed`) */}
              <div className='w-full h-48 rounded-3xl overflow-hidden border border-primary/20 shadow-sm bg-muted/30 relative'>
                <iframe
                  width='100%'
                  height='100%'
                  frameBorder='0'
                  scrolling='no'
                  marginHeight={0}
                  marginWidth={0}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                  className='absolute inset-0'
                />
              </div>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                target='_blank'
                rel='noopener noreferrer'
                className='w-full rounded-[2rem] border border-primary/30 bg-transparent hover:bg-primary/5 transition-colors flex items-center justify-center gap-3 py-4 px-6 text-xs font-bold uppercase tracking-widest text-[#5a3040]/90'
              >
                <Navigation className='w-4 h-4 text-primary/80' />
                <span>Ouvrir dans Google Maps</span>
                <ExternalLink className='w-3 h-3 text-[#5a3040]/60 ml-1' />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

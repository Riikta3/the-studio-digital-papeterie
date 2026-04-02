"use client";
import { motion } from "framer-motion";

interface FooterProps {
  profile: {
    first_name: string;
    partner_name: string;
    wedding_date?: string | null;
  };
}

export function InvitationFooter({ profile }: FooterProps) {
  const formattedDate = profile.wedding_date
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(profile.wedding_date))
    : null;

  return (
    <footer className='w-full bg-foreground overflow-hidden'>
      {/* Bande de timbres décorative */}
      <div className='w-full flex'>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className='h-2 flex-1'
            style={{
              background: i % 2 === 0 ? "#FDFDFA" : "#0E2F44",
              borderRadius: "0 0 4px 4px",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-3xl mx-auto px-6 py-16 md:py-20'
      >
        {/* Layout carte postale */}
        <div className='flex flex-col md:flex-row gap-10 md:gap-0'>
          {/* Gauche — message */}
          <div className='flex-1 md:pr-12 md:border-r border-background/10 flex flex-col justify-between gap-8'>
            <div>
              <p className='text-[10px] uppercase tracking-[0.4em] text-primary font-sans mb-4'>
                À bord du vol ✦ Paris → Pour toujours
              </p>
              <h2
                className='text-4xl md:text-5xl text-background font-normal leading-tight'
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                {profile.first_name}
                <br />
                <span className='text-primary'>&</span> {profile.partner_name}
              </h2>
            </div>

            {formattedDate && (
              <div className='flex items-center gap-4'>
                <div className='w-8 h-px bg-background/20' />
                <p className='text-[10px] uppercase tracking-[0.35em] text-background/40 font-sans'>
                  le {formattedDate}
                </p>
              </div>
            )}

            <p className='text-[9px] uppercase tracking-[0.25em] text-background/20 font-sans mt-auto pt-8'>
              The Studio Papeterie Digital
            </p>
          </div>

          {/* Droite — adresse postale */}
          <div className='md:pl-12 flex flex-col gap-6 md:w-56'>
            {/* Cadenas cœurs */}
            <img
              src='/videos/theme/travel/Image iLoveIMG (7).png'
              alt=''
              aria-hidden='true'
              className='self-end w-20 h-20 object-contain'
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(45%) sepia(60%) saturate(600%) hue-rotate(345deg) brightness(95%)",
                opacity: 0.7,
              }}
            />

            {/* Destinataire */}
            <div className='space-y-3'>
              <p className='text-[11px] text-background/70 font-sans font-light leading-relaxed'>
                Nos invités bien-aimés
              </p>
              <div className='space-y-2'>
                <div className='w-full h-px bg-background/10' />
                <div className='w-full h-px bg-background/10' />
                <div className='w-3/4 h-px bg-background/10' />
              </div>
            </div>

            {/* Cachet circulaire style tampon postal */}
            <div className='self-start mt-2 w-16 h-16 rounded-full border border-[#FDFDFA]/15 flex flex-col items-center justify-center gap-0.5 relative'>
              <div className='absolute inset-1 rounded-full border border-[#FDFDFA]/8' />
              <p className='text-[5px] uppercase tracking-[0.2em] text-[#FDFDFA]/30 font-sans'>
                Mariage
              </p>
              <p className='text-[7px] text-[#FDFDFA]/40 font-sans'>✦ 2026 ✦</p>
              <p className='text-[5px] uppercase tracking-[0.2em] text-[#FDFDFA]/30 font-sans'>
                France
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bande de timbres décorative bas */}
      <div className='w-full flex'>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className='h-2 flex-1'
            style={{
              background: i % 2 === 0 ? "#FDFDFA" : "#0E2F44",
              borderRadius: "4px 4px 0 0",
            }}
          />
        ))}
      </div>
    </footer>
  );
}

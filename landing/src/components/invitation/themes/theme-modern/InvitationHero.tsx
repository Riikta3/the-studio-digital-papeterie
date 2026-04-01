"use client";
import { motion } from "framer-motion";
import { useRef } from "react";
interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
}
export function InvitationHero({
  firstName,
  partnerName,
  weddingDate,
}: InvitationHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handleLoadedMetadata = () => {
    if (videoRef.current) videoRef.current.playbackRate = 1;
  };
  const formattedDate = weddingDate
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(weddingDate))
    : "";
  return (
    <section className='h-[100svh] flex flex-col items-center justify-center relative bg-white'>
      <div className='absolute inset-0 overflow-hidden'>
        <video
          autoPlay
          loop
          muted
          playsInline
          className='absolute inset-0 w-full h-full object-contain object-[center_75%] pr-5'
          src='/videos/theme/travel/mariage-voyage-hublot-avion.webm'
          ref={videoRef}
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='flex flex-col items-center text-center px-6 mt-6 gap-4 z-10 absolute top-10 left-0 right-0'
      >
        <h1
          className='text-4xl sm:text-5xl leading-tight text-[#1a1a2e] font-normal'
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: "0.02em",
          }}
        >
          {firstName} <span className='text-[#be185d]'>&</span> {partnerName}
        </h1>
        <p className='text-sm text-[#1a1a2e]/60 font-sans font-light tracking-wide'>
          vous invitent à leur mariage
        </p>
        {formattedDate && (
          <p className='text-xs uppercase tracking-[0.4em] text-[#be185d]/70 font-sans font-medium mt-1'>
            le {formattedDate}
          </p>
        )}
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className='absolute bottom-8 left-0 right-0 flex justify-center z-10'
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          className='flex flex-col items-center gap-1 cursor-pointer'
          onClick={() =>
            document
              .getElementById("modules")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <span className='text-[9px] uppercase tracking-[0.3em] text-[#1a1a2e]/40 font-sans'>
            Découvrir
          </span>
          <svg
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            className='text-[#1a1a2e]/30'
          >
            <path
              d='M8 3v10M8 13l-4-4M8 13l4-4'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

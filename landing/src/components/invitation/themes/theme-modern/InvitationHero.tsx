"use client";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useInvitationContext } from "../../InvitationContext";

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
  const { introDone } = useInvitationContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!introDone) return;
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 1;
    video.play();
  }, [introDone]);
  const formattedDate = weddingDate
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(weddingDate))
    : "";

  return (
    <section className='h-[100svh] flex flex-col bg-[#FFFCFB] overflow-hidden'>
      {/* ── TEXT — au-dessus de la vidéo dans le flux ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='flex flex-col items-center text-center gap-3 pt-10 pb-6 px-8 shrink-0'
      >
        <p className='text-[9px] uppercase tracking-[0.45em] text-[#1B4F72]/50 font-sans'>
          Invitation au mariage de
        </p>

        <h1
          className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-[#0E2F44] font-normal'
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: "0.02em",
          }}
        >
          {firstName} <span className='text-[#D35400]'>&</span> {partnerName}
        </h1>

        {formattedDate && (
          <p className='text-xs uppercase tracking-[0.4em] text-[#D35400]/70 font-sans font-medium'>
            le {formattedDate}
          </p>
        )}

        <div className='flex items-center gap-4 mt-1'>
          <div className='w-10 h-px bg-[#1B4F72]/20' />
          <div className='w-1.5 h-1.5 rounded-full bg-[#D35400]/50' />
          <div className='w-10 h-px bg-[#1B4F72]/20' />
        </div>
      </motion.div>

      {/* ── VIDEO — prend le reste de la hauteur ──────────────────────── */}
      <div className='flex-1 relative overflow-hidden'>
        <video
          loop
          muted
          playsInline
          className='w-full h-full pb-10 object-contain object-top'
          src='/videos/theme/travel/mariage-voyage-hublot-avion.webm'
          ref={videoRef}
        />

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className='absolute bottom-8 left-0 right-0 flex justify-center'
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className='flex flex-col items-center gap-1 cursor-pointer mt-10'
            onClick={() =>
              document
                .getElementById("modules")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className='text-[9px] uppercase tracking-[0.3em] text-[#0E2F44]/40 font-sans'>
              Découvrir
            </span>
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill='none'
              className='text-[#0E2F44]/30'
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
      </div>
    </section>
  );
}

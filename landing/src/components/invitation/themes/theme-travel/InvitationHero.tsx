"use client";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useInvitationContext } from "../../InvitationContext";

const FILTER_ABYSSE =
  "brightness(0) saturate(100%) invert(22%) sepia(60%) saturate(600%) hue-rotate(178deg) brightness(85%)";

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
    <section className='h-[100svh] flex flex-col bg-background overflow-hidden relative'>

      {/* ── Timbre — haut droite ───────────────────────────────────────── */}
      <img
        src='/videos/theme/travel/Image iLoveIMG (6).png'
        alt=''
        aria-hidden='true'
        className='absolute top-3 right-3 w-16 md:w-20 pointer-events-none select-none z-10'
        style={{ filter: FILTER_ABYSSE, opacity: 0.18 }}
      />

      {/* ── TEXT ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='flex flex-col items-center text-center gap-3 pt-10 pb-4 px-8 shrink-0 relative z-10'
      >
        <p className='text-[9px] uppercase tracking-[0.45em] text-secondary/50 font-sans'>
          Invitation au mariage de
        </p>

        <h1
          className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-foreground font-normal'
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            letterSpacing: "0.02em",
          }}
        >
          {firstName} <span className='text-primary'>&</span> {partnerName}
        </h1>

        {formattedDate && (
          <p className='text-xs uppercase tracking-[0.4em] text-primary/70 font-sans font-medium'>
            le {formattedDate}
          </p>
        )}

        <div className='flex items-center gap-4 mt-1'>
          <div className='w-10 h-px bg-secondary/20' />
          <div className='w-1.5 h-1.5 rounded-full bg-primary/50' />
          <div className='w-10 h-px bg-secondary/20' />
        </div>
      </motion.div>

      {/* ── Avion tracé pointillés — entre texte et vidéo ─────────────── */}
      <div className='relative shrink-0 flex justify-center items-center py-2 z-10'>
        <img
          src='/videos/theme/travel/Image iLoveIMG.png'
          alt=''
          aria-hidden='true'
          className='w-48 md:w-64'
          style={{ filter: FILTER_ABYSSE, opacity: 0.2 }}
        />
      </div>

      {/* ── VIDEO ─────────────────────────────────────────────────────── */}
      <div className='flex-1 min-h-0 relative overflow-hidden'>
        <video
          loop
          muted
          playsInline
          className='absolute inset-0 w-full h-full object-contain object-top md:max-h-[60vh] md:w-auto md:left-1/2 md:-translate-x-1/2'
          src='/videos/theme/travel/mariage-voyage-hublot-avion.webm'
          ref={videoRef}
        />
      </div>

      {/* ── Scroll cue — sous la vidéo ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className='shrink-0 flex justify-center pb-6 pt-2 z-20'
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
          <span className='text-[9px] uppercase tracking-[0.3em] text-foreground/40 font-sans'>
            Découvrir
          </span>
          <svg width='16' height='16' viewBox='0 0 16 16' fill='none' className='text-foreground/30'>
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

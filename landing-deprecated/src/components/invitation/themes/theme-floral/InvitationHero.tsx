"use client";
import { motion } from "framer-motion";

interface InvitationHeroProps {
  firstName: string;
  partnerName: string;
  weddingDate?: string | null;
}

export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(weddingDate))
    : "";
  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#fdf6f0]">
      <svg className="absolute top-0 left-0 w-64 h-64 opacity-20 text-[#c97a90]" viewBox="0 0 200 200" fill="none">
        <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="0.5" />
        <circle cx="80" cy="20" r="20" stroke="currentColor" strokeWidth="0.5" />
        <path d="M10 100 Q50 60 100 80 Q140 100 180 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </svg>
      <svg className="absolute bottom-0 right-0 w-64 h-64 opacity-20 text-[#c97a90] rotate-180" viewBox="0 0 200 200" fill="none">
        <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="0.5" />
        <path d="M10 100 Q50 60 100 80 Q140 100 180 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </svg>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-5 relative z-10">
        <p className="text-[10px] uppercase tracking-[0.5em] text-[#c97a90]/70 font-sans">Vous êtes cordialement invités au mariage de</p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight text-[#5a3040]"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}>
          {firstName}
          <span className="block text-[#c97a90]/50 text-3xl sm:text-4xl my-2 not-italic">&</span>
          {partnerName}
        </h1>
        {formattedDate && <p className="text-xs uppercase tracking-[0.3em] text-[#5a3040]/60 font-sans mt-2">{formattedDate}</p>}
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.8 }}
          className="w-24 h-px bg-[#c97a90]/40 mt-2" />
      </motion.div>
    </section>
  );
}

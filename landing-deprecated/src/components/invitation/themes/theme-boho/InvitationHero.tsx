"use client";
import { motion } from "framer-motion";

interface InvitationHeroProps { firstName: string; partnerName: string; weddingDate?: string | null; }

export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate ? new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(weddingDate)) : "";
  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#fdf0e5]">
      <svg className="absolute top-0 right-0 w-72 h-72 opacity-10 text-[#a98467]" viewBox="0 0 200 200" fill="none">
        <path d="M180 10 Q120 60 100 100 Q80 140 20 180" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M160 20 Q140 40 130 60" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="130" cy="60" r="4" fill="currentColor" opacity="0.4" />
        <circle cx="100" cy="100" r="5" fill="currentColor" opacity="0.3" />
      </svg>
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:1.2, ease:"easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-5 relative z-10">
        <p className="text-[10px] uppercase tracking-[0.45em] text-[#a98467]/60 font-sans">Rejoignez-nous pour célébrer</p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight text-[#4a3728]" style={{ fontFamily:"Georgia, serif", fontStyle:"italic" }}>
          {firstName}
          <span className="block text-[#a98467]/40 text-2xl my-3 not-italic font-sans tracking-[0.3em]">✦ &amp; ✦</span>
          {partnerName}
        </h1>
        {formattedDate && <p className="text-xs uppercase tracking-[0.35em] text-[#4a3728]/50 font-sans mt-2">{formattedDate}</p>}
        <div className="flex items-center gap-3 mt-3">
          <div className="h-px w-12 bg-[#a98467]/30" />
          <div className="w-2 h-2 rounded-full bg-[#a98467]/40" />
          <div className="h-px w-12 bg-[#a98467]/30" />
        </div>
      </motion.div>
    </section>
  );
}

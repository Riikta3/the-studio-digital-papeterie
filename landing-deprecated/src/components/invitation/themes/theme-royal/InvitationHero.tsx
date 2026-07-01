"use client";
import { motion } from "framer-motion";
interface InvitationHeroProps { firstName: string; partnerName: string; weddingDate?: string | null; }
export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate ? new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(weddingDate)) : "";
  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#eef2ff]">
      <div className="absolute inset-8 border border-[#c4a23a]/20 pointer-events-none" />
      <div className="absolute inset-10 border border-[#c4a23a]/10 pointer-events-none" />
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:1.2, ease:"easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-5 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-[#c4a23a]/40" /><span className="text-[#c4a23a]/60 text-xs">✦</span><div className="h-px w-8 bg-[#c4a23a]/40" />
        </div>
        <p className="text-[9px] uppercase tracking-[0.6em] text-[#1e3a8a]/50 font-sans">Vous êtes cordialement invités</p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl leading-tight text-[#1e3a8a]" style={{ fontFamily:"Georgia, serif" }}>
          {firstName}
          <span className="block text-[#c4a23a]/60 text-xl my-3 tracking-[0.5em] font-sans font-light">&amp;</span>
          {partnerName}
        </h1>
        {formattedDate && <p className="text-[10px] uppercase tracking-[0.4em] text-[#1e3a8a]/40 font-sans mt-1">{formattedDate}</p>}
        <div className="flex items-center gap-3 mt-3">
          <div className="h-px w-16 bg-[#c4a23a]/30" /><span className="text-[#c4a23a]/50 text-xs">✦</span><div className="h-px w-16 bg-[#c4a23a]/30" />
        </div>
      </motion.div>
    </section>
  );
}

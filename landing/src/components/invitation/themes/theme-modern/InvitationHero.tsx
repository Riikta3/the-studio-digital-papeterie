"use client";
import { motion } from "framer-motion";
interface InvitationHeroProps { firstName: string; partnerName: string; weddingDate?: string | null; }
export function InvitationHero({ firstName, partnerName, weddingDate }: InvitationHeroProps) {
  const formattedDate = weddingDate ? new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric"}).format(new Date(weddingDate)) : "";
  return (
    <section className="h-[100svh] flex flex-col items-center justify-center relative overflow-hidden bg-[#fff0f5]">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full border-2 border-[#be185d]/10 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border border-[#be185d]/8 pointer-events-none" />
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.8, ease:"easeOut" }}
        className="flex flex-col items-center text-center px-6 gap-4 relative z-10">
        <p className="text-[9px] uppercase tracking-[0.6em] text-[#be185d]/50 font-sans font-bold">Mariage</p>
        <h1 className="text-6xl sm:text-7xl md:text-8xl leading-none text-[#1a1a2e] font-black"
          style={{ fontFamily:"'Montserrat', system-ui, sans-serif", letterSpacing:"-0.02em" }}>{firstName}</h1>
        <div className="w-12 h-1 bg-[#be185d] rounded-full" />
        <h1 className="text-6xl sm:text-7xl md:text-8xl leading-none text-[#1a1a2e] font-black"
          style={{ fontFamily:"'Montserrat', system-ui, sans-serif", letterSpacing:"-0.02em" }}>{partnerName}</h1>
        {formattedDate && <p className="text-xs uppercase tracking-[0.4em] text-[#1a1a2e]/40 font-sans font-bold mt-4">{formattedDate}</p>}
      </motion.div>
    </section>
  );
}

"use client";
import { motion } from "framer-motion";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModuleProps } from "../../module-registry";

function getDefaultDate(): string {
  const d = new Date(); d.setMonth(d.getMonth() + 9); return d.toISOString();
}
function generateICS(dateStr: string, title: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
  const nd = new Date(d); nd.setDate(nd.getDate()+1);
  const end = `${nd.getFullYear()}${pad(nd.getMonth()+1)}${pad(nd.getDate())}`;
  return ["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT",`DTSTART;VALUE=DATE:${stamp}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${title}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
}

export function CountdownModule({ weddingDate, partner1, partner2 }: ModuleProps) {
  const target = weddingDate || getDefaultDate();
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const diff = +new Date(target) - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return { days: Math.floor(diff/86400000), hours: Math.floor((diff/3600000)%24), minutes: Math.floor((diff/60000)%60), seconds: Math.floor((diff/1000)%60) };
    };
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);

  useEffect(() => {
    if (!calOpen) return;
    const handler = (e: MouseEvent) => { if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  if (!mounted) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const formattedDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(target));
  const title = `Mariage de ${partner1 || "Sophie"} & ${partner2 || "Pierre"}`;
  const d = new Date(target); const nd = new Date(d); nd.setDate(nd.getDate()+1);
  const toStamp = (dt: Date) => `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,"0")}${String(dt.getDate()).padStart(2,"0")}`;
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toStamp(d)}/${toStamp(nd)}`;

  return (
    <section className="w-full pt-16 pb-16" style={{ background: "linear-gradient(to bottom, white 0%, #fff0f5 60%)" }}>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.9, ease: "easeOut" }}
        className="max-w-2xl mx-auto flex flex-col items-center text-center px-4 gap-8">
        <p className="text-[10px] uppercase tracking-[0.4em] text-[#be185d]/60 font-sans">Le grand jour approche</p>
        <div className="flex items-start gap-8 sm:gap-12">
          {[{v:time.days,l:"Jours"},{v:time.hours,l:"Heures"},{v:time.minutes,l:"Minutes"},{v:time.seconds,l:"Secondes"}].map((block) => (
            <div key={block.l} className="flex flex-col items-center gap-2">
              <motion.span key={block.v} initial={{ opacity: 0.6, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className="text-5xl sm:text-6xl text-[#1a1a2e] tabular-nums"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic" }}>
                {pad(block.v)}
              </motion.span>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#be185d]/50 font-sans">{block.l}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 w-full max-w-xs">
          <div className="flex-1 h-px bg-[#be185d]/20" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#1a1a2e]/50 font-sans whitespace-nowrap">{formattedDate}</span>
          <div className="flex-1 h-px bg-[#be185d]/20" />
        </div>
        <div ref={calRef} className="relative">
          <button onClick={() => setCalOpen(v => !v)}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#be185d]/30 text-[#1a1a2e] text-[11px] uppercase tracking-[0.2em] font-sans hover:bg-[#be185d]/5 transition-colors">
            <CalendarPlus className="w-3.5 h-3.5 text-[#be185d]" />
            Ajouter à mon agenda
            <ChevronDown className={`w-3 h-3 text-[#be185d]/50 transition-transform ${calOpen?"rotate-180":""}`} />
          </button>
          {calOpen && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-white border border-[#be185d]/20 rounded-2xl shadow-xl overflow-hidden z-50">
              <button onClick={() => { window.open(googleUrl,"_blank"); setCalOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm text-[#1a1a2e] hover:bg-[#fff0f5] transition-colors border-b border-[#be185d]/10">Google Calendar</button>
              <button onClick={() => {
                const blob = new Blob([generateICS(target,title)],{type:"text/calendar"});
                const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="mariage.ics";
                document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); setCalOpen(false);
              }} className="w-full px-4 py-3 text-left text-sm text-[#1a1a2e] hover:bg-[#fff0f5] transition-colors">Apple / Outlook (.ics)</button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}

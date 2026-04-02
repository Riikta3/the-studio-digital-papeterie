"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModuleProps } from "../../module-registry";

function getDefaultDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 9);
  return d.toISOString();
}
function generateICS(dateStr: string, title: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const nd = new Date(d);
  nd.setDate(nd.getDate() + 1);
  const end = `${nd.getFullYear()}${pad(nd.getMonth() + 1)}${pad(nd.getDate())}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${stamp}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

const FlipUnit = ({ value, label }: { value: number; label: string }) => {
  const formatted = String(value).padStart(2, "0");

  return (
    <div className='flex flex-col items-center gap-3'>
      <div
        className='relative h-[80px] sm:h-[110px] bg-foreground rounded-lg shadow-lg shadow-foreground/10 flex flex-col items-center justify-center border border-white/10'
        style={{ perspective: "500px" }}
      >
        <span className='invisible text-4xl sm:text-6xl font-bold tabular-nums tracking-tight px-3 sm:px-4'>
          {formatted}
        </span>

        <div className='absolute inset-x-0 top-0 h-1/2 bg-foreground rounded-t-lg overflow-hidden flex items-end justify-center pb-[1px]'>
          <span className='text-4xl sm:text-6xl font-bold text-background tabular-nums translate-y-1/2 font-sans tracking-tight'>
            {formatted}
          </span>
        </div>

        <div className='absolute inset-x-0 bottom-0 h-1/2 bg-foreground rounded-b-lg overflow-hidden flex items-start justify-center pt-[1px]'>
          <div className='absolute inset-0 bg-black/20 rounded-b-lg pointer-events-none' />
          <span className='text-4xl sm:text-6xl font-bold text-background tabular-nums -translate-y-1/2 font-sans tracking-tight drop-shadow-md'>
            {formatted}
          </span>
        </div>

        <div className='absolute inset-x-0 top-1/2 h-[1px] bg-black/40 z-20 shadow-sm' />

        <AnimatePresence mode='popLayout'>
          <motion.div
            key={value}
            initial={{ rotateX: -90, filter: "brightness(1.5)" }}
            animate={{ rotateX: 0, filter: "brightness(1)" }}
            exit={{ rotateX: 90, filter: "brightness(0.5)", opacity: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.25 }}
            style={{ transformOrigin: "bottom" }}
            className='absolute inset-x-0 top-0 h-1/2 bg-foreground rounded-t-lg overflow-hidden flex items-end justify-center pb-[1px] z-10'
          >
            <span className='text-4xl sm:text-6xl font-bold text-background tabular-nums translate-y-1/2 font-sans tracking-tight'>
              {formatted}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <span className='text-[9px] sm:text-[11px] uppercase tracking-[0.25em] text-foreground/80 font-sans font-medium'>
        {label}
      </span>
    </div>
  );
};

export function CountdownModule({
  weddingDate,
  partner1,
  partner2,
}: ModuleProps) {
  const target = weddingDate || getDefaultDate();
  const [time, setTime] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const diff = +new Date(target) - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTime(calc());
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);

  useEffect(() => {
    if (!calOpen) return;
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node))
        setCalOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  if (!mounted) return null;
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(target));
  const title = `Mariage de ${partner1 || "Sophie"} & ${partner2 || "Pierre"}`;
  const d = new Date(target);
  const nd = new Date(d);
  nd.setDate(nd.getDate() + 1);
  const toStamp = (dt: Date) =>
    `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, "0")}${String(dt.getDate()).padStart(2, "0")}`;
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toStamp(d)}/${toStamp(nd)}`;

  return (
    <section className='w-full pb-20 bg-background overflow-hidden'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className='max-w-4xl mx-auto flex flex-col items-center text-center px-4 gap-12'
      >
        <p className='text-[11px] sm:text-xs uppercase tracking-[0.4em] text-primary/60 font-sans'>
          Le grand jour approche
        </p>

        <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10'>
          {[
            { v: time.days, l: "Jours" },
            { v: time.hours, l: "Heures" },
            { v: time.minutes, l: "Minutes" },
            { v: time.seconds, l: "Secondes" },
          ].map((block) => (
            <FlipUnit
              key={block.l}
              value={block.v}
              label={block.l}
            />
          ))}
        </div>

        <div className='flex flex-col items-center gap-8 mt-4 w-full max-w-sm'>
          <div className='flex items-center gap-4 w-full'>
            <div className='flex-1 h-px bg-primary/20' />
            <span className='text-[11px] sm:text-xs uppercase tracking-[0.2em] text-foreground/50 font-sans whitespace-nowrap'>
              {formattedDate}
            </span>
            <div className='flex-1 h-px bg-primary/20' />
          </div>

          <div
            ref={calRef}
            className='relative z-30'
          >
            <button
              onClick={() => setCalOpen((v) => !v)}
              className='flex items-center gap-3 px-8 py-4 rounded-full bg-primary/5 border border-primary/20 text-foreground text-[11px] uppercase tracking-[0.2em] font-sans hover:bg-primary/10 transition-colors shadow-sm'
            >
              <CalendarPlus className='w-4 h-4 text-primary' />
              Ajouter à mon agenda
              <ChevronDown
                className={`w-3.5 h-3.5 text-primary/50 transition-transform ${calOpen ? "rotate-180" : ""}`}
              />
            </button>
            {calOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className='absolute top-full mt-3 left-1/2 -translate-x-1/2 w-56 bg-card border border-primary/20 rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden'
              >
                <button
                  onClick={() => {
                    window.open(googleUrl, "_blank");
                    setCalOpen(false);
                  }}
                  className='w-full px-5 py-3.5 text-left text-sm text-foreground hover:bg-primary/5 transition-colors border-b border-primary/10 font-medium'
                >
                  Google Calendar
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([generateICS(target, title)], {
                      type: "text/calendar",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "mariage.ics";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    setCalOpen(false);
                  }}
                  className='w-full px-5 py-3.5 text-left text-sm text-foreground hover:bg-primary/5 transition-colors font-medium'
                >
                  Apple / Outlook (.ics)
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { CalendarPlus, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CountdownData {
  targetDate: string;
}

function getDefaultWeddingDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 9);
  d.setDate(d.getDate() + 4);
  return d.toISOString();
}

const MOCK_COUNTDOWN: CountdownData = {
  targetDate: getDefaultWeddingDate(),
};

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function toDateStamp(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function toISODate(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

function nextDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d;
}

function generateICS(dateStr: string, title: string): string {
  const start = toDateStamp(dateStr);
  const nd = nextDay(dateStr);
  const end = `${nd.getFullYear()}${String(nd.getMonth() + 1).padStart(2, "0")}${String(nd.getDate()).padStart(2, "0")}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Studio Digital//Invitation//FR",
    "BEGIN:VEVENT",
    `UID:mariage-${start}@thestudio.digital`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${title}`,
    "DESCRIPTION:Nous vous attendons avec impatience pour partager ce jour si spécial.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(dateStr: string, title: string) {
  const blob = new Blob([generateICS(dateStr, title)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "notre-mariage.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Add to Calendar dropdown ─────────────────────────────────────────────────

function AddToCalendar({
  dateStr,
  partner1,
  partner2,
}: {
  dateStr: string;
  partner1: string;
  partner2: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const eventTitle = `SAVE THE DATE - Mariage de ${partner1} & ${partner2} \u2665`;
  const eventDescription =
    "Nous vous attendons avec impatience pour partager ce jour si spécial.";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const nd = nextDay(dateStr);
  const endStamp = `${nd.getFullYear()}${String(nd.getMonth() + 1).padStart(2, "0")}${String(nd.getDate()).padStart(2, "0")}`;

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${toDateStamp(dateStr)}/${endStamp}&details=${encodeURIComponent(eventDescription)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${toISODate(dateStr)}&enddt=${toISODate(nd.toISOString())}&allday=true&body=${encodeURIComponent(eventDescription)}`;

  const options = [
    {
      label: "Google",
      icon: (
        <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none'>
          <rect width='24' height='24' rx='4' fill='#fff' />
          <path d='M19 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1Z' fill='#4285F4' />
          <rect x='8' y='3' width='2' height='4' rx='1' fill='#1a73e8' />
          <rect x='14' y='3' width='2' height='4' rx='1' fill='#1a73e8' />
          <rect x='4' y='9' width='16' height='1.5' fill='#fff' opacity='0.5' />
          <rect x='7' y='12' width='4' height='4' rx='1' fill='#fff' />
        </svg>
      ),
      action: () => {
        window.open(googleUrl, "_blank", "noopener,noreferrer");
        setOpen(false);
      },
    },
    {
      label: "Apple",
      icon: (
        <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none'>
          <rect width='24' height='24' rx='4' fill='#f5f5f7' />
          <path d='M12 4.5C8.96 4.5 6.5 6.96 6.5 10c0 2.21 1.28 4.12 3.15 5.06L8.5 18h7l-1.15-2.94C16.22 14.12 17.5 12.21 17.5 10c0-3.04-2.46-5.5-5.5-5.5Z' fill='#1d1d1f' />
          <ellipse cx='14.5' cy='5.5' rx='1.5' ry='2' fill='#34c759' />
        </svg>
      ),
      action: () => {
        downloadICS(dateStr, eventTitle);
        setOpen(false);
      },
    },
    {
      label: "Outlook",
      icon: (
        <svg viewBox='0 0 24 24' className='w-4 h-4' fill='none'>
          <rect width='24' height='24' rx='4' fill='#0078d4' />
          <rect x='4' y='6' width='10' height='12' rx='1.5' fill='#fff' />
          <ellipse cx='16' cy='12' rx='3.5' ry='4' fill='#28a8e0' />
          <ellipse cx='16' cy='12' rx='2' ry='2.5' fill='#fff' />
        </svg>
      ),
      action: () => {
        window.open(outlookUrl, "_blank", "noopener,noreferrer");
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={ref} className='relative'>
      <button
        onClick={() => setOpen((v) => !v)}
        className='flex items-center gap-2.5 px-7 py-3.5 rounded-full border border-border bg-card text-foreground text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300'
      >
        <CalendarPlus className='w-3.5 h-3.5 text-primary' />
        Ajouter à mon agenda
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className='absolute top-full mt-2 left-1/2 -translate-x-1/2 w-52 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50'
        >
          {options.map((opt, i) => (
            <button
              key={opt.label}
              onClick={opt.action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-foreground hover:bg-muted/60 transition-colors ${i < options.length - 1 ? "border-b border-border/60" : ""}`}
            >
              <span className='w-6 h-6 flex items-center justify-center rounded-md overflow-hidden shrink-0'>
                {opt.icon}
              </span>
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Main module ──────────────────────────────────────────────────────────────

export function CountdownModule({
  weddingId,
  weddingDate,
  partner1,
  partner2,
}: {
  weddingId: string;
  weddingDate?: string | null;
  partner1?: string;
  partner2?: string;
}) {
  const targetDateStr = weddingDate || MOCK_COUNTDOWN.targetDate;

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const calculate = () => {
      const diff = +new Date(targetDateStr) - +new Date();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculate());
    const timer = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(timer);
  }, [targetDateStr]);

  if (!isMounted) return null;

  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(targetDateStr));

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className='max-w-2xl mx-auto flex flex-col items-center text-center px-4'
      >
        {/* Eyebrow */}
        <p className='text-[10px] font-bold uppercase tracking-[0.35em] text-primary/50 mb-12'>
          Le grand jour approche
        </p>

        {/* All units on one line */}
        <div className='flex items-start justify-center gap-6 sm:gap-10 md:gap-14 mb-10'>
          {[
            { value: timeLeft.days, label: "Jours" },
            { value: timeLeft.hours, label: "Heures" },
            { value: timeLeft.minutes, label: "Minutes" },
            { value: timeLeft.seconds, label: "Secondes" },
          ].map((block, i) => (
            <div key={block.label} className='relative flex flex-col items-center'>
              {i > 0 && (
                <span className='absolute -left-3 sm:-left-5 md:-left-7 top-2 text-primary/20 font-light text-2xl md:text-3xl select-none leading-none'>
                  ·
                </span>
              )}
              <motion.span
                key={block.value}
                initial={{ opacity: 0.5, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`font-heading italic text-5xl sm:text-6xl md:text-7xl leading-none tabular-nums ${
                  block.label === "Secondes" ? "text-primary/50" : "text-foreground"
                }`}
              >
                {pad(block.value)}
              </motion.span>
              <span className='text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground/50 mt-3'>
                {block.label}
              </span>
            </div>
          ))}
        </div>

        {/* Date formatted — decorative rule */}
        <div className='flex items-center gap-4 w-full max-w-xs mb-12'>
          <div className='flex-1 h-px bg-border' />
          <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap'>
            {formattedDate}
          </span>
          <div className='flex-1 h-px bg-border' />
        </div>

        {/* Calendar CTA */}
        <AddToCalendar
          dateStr={targetDateStr}
          partner1={partner1 || "Sarah"}
          partner2={partner2 || "Mickael"}
        />
      </motion.div>
    </section>
  );
}

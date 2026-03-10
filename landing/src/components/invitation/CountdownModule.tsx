"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// --- Data Types for Future DB ---
interface CountdownData {
  targetDate: string; // ISO String format
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

export function CountdownModule({
  weddingId,
  weddingDate,
}: {
  weddingId: string;
  weddingDate?: string | null;
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

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDateStr) - +new Date();
      let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return newTimeLeft;
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDateStr]);

  if (!isMounted) return null;

  const timeBlocks = [
    { label: "Jours", value: timeLeft.days },
    { label: "Heures", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Secondes", value: timeLeft.seconds },
  ];

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-4xl mx-auto flex flex-col items-center justify-center text-center px-4'
      >
        <p className='text-[11px] md:text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground mb-8 md:mb-10'>
          Le compte à rebours est lancé
        </p>

        <div className='flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8'>
          {timeBlocks.map((block, index) => (
            <div
              key={block.label}
              className='flex flex-col items-center'
            >
              <div className='w-[72px] h-[85px] sm:w-[85px] sm:h-[100px] md:w-[95px] md:h-[115px] bg-card border border-border rounded-[1rem] sm:rounded-[1.25rem] shadow-xl flex items-center justify-center mb-4 md:mb-6'>
                <span className='font-heading text-[2.5rem] sm:text-[3rem] md:text-[3.5rem] text-foreground font-light leading-none'>
                  {block.value.toString().padStart(2, "0")}
                </span>
              </div>
              <span className='text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.25em] text-muted-foreground text-center'>
                {block.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

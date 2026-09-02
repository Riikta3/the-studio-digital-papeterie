"use client";

import { intervalToDuration } from "date-fns";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface CountdownTimerProps {
  date: Date;
}

export function CountdownTimer({ date }: CountdownTimerProps) {
  const t = useTranslations("CountdownTimer");
  const [timeLeft, setTimeLeft] = useState<{
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      if (now >= date) {
        setTimeLeft(null);
        return;
      }

      const duration = intervalToDuration({
        start: now,
        end: date,
      });

      const totalMonths = (duration.years || 0) * 12 + (duration.months || 0);

      setTimeLeft({
        months: totalMonths,
        days: duration.days || 0,
        hours: duration.hours || 0,
        minutes: duration.minutes || 0,
        seconds: duration.seconds || 0,
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [date]);

  if (!timeLeft) {
    return (
      <div className='text-xl font-heading text-studio-violet'>
        {t("big_day")}
      </div>
    );
  }

  return (
    <div className='flex flex-col items-start justify-start text-left w-full'>
      <div className='flex flex-wrap items-baseline justify-start gap-6 font-heading text-studio-violet'>
        {/* Months */}
        {timeLeft.months > 0 && (
          <div className='flex flex-col items-center min-w-[4rem]'>
            <span className='text-3xl md:text-5xl font-light'>
              {timeLeft.months}
            </span>
            <span className='text-xs uppercase text-studio-violet/60 font-sans tracking-wider mt-1'>
              {t("months")}
            </span>
          </div>
        )}

        {/* Days */}
        <div className='flex flex-col items-center min-w-[4rem]'>
          <span className='text-3xl md:text-5xl font-light'>
            {timeLeft.days}
          </span>
          <span className='text-xs uppercase text-studio-violet/60 font-sans tracking-wider mt-1'>
            {t("days")}
          </span>
        </div>

        {/* Hours */}
        <div className='flex flex-col items-center min-w-[4rem]'>
          <span className='text-3xl md:text-5xl font-light tabular-nums'>
            {timeLeft.hours.toString().padStart(2, "0")}
          </span>
          <span className='text-xs uppercase text-studio-violet/60 font-sans tracking-wider mt-1'>
            {t("hours")}
          </span>
        </div>

        {/* Minutes */}
        <div className='flex flex-col items-center min-w-[4rem]'>
          <span className='text-3xl md:text-5xl font-light tabular-nums'>
            {timeLeft.minutes.toString().padStart(2, "0")}
          </span>
          <span className='text-xs uppercase text-studio-violet/60 font-sans tracking-wider mt-1'>
            {t("minutes")}
          </span>
        </div>

        {/* Seconds */}
        <div className='flex flex-col items-center min-w-[4rem]'>
          <span className='text-3xl md:text-5xl font-light tabular-nums'>
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
          <span className='text-xs uppercase text-studio-violet/60 font-sans tracking-wider mt-1'>
            {t("seconds")}
          </span>
        </div>
      </div>
    </div>
  );
}

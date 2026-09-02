"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

type Props = {
  visitsByDay: Array<{ date: string; visits: number }>;
};

const WIDTH = 600;
const HEIGHT = 160;
const PADDING_X = 8;
const PADDING_Y = 12;

/**
 * A 30-day visit trend as a set of thin bars. Single hue (magnitude, not
 * identity) per the dataviz skill; scrolls inside its own container so it
 * never forces the page wider than 375px.
 */
export function VisitTrendChart({ visitsByDay }: Props) {
  const t = useTranslations("Stats");
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const max = Math.max(...visitsByDay.map((d) => d.visits), 1);
  const barWidth = (WIDTH - PADDING_X * 2) / visitsByDay.length;
  const innerHeight = HEIGHT - PADDING_Y * 2;

  const active = activeIndex !== null ? visitsByDay[activeIndex] : null;

  return (
    <div className='relative'>
      <div className='overflow-x-auto'>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className='h-40 w-full min-w-[420px]'
          role='img'
          aria-label={t("trend.aria_label")}
        >
          <defs>
            <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
              <stop offset='0%' stopColor='#4B3F72' stopOpacity='0.9' />
              <stop offset='100%' stopColor='#4B3F72' stopOpacity='0.55' />
            </linearGradient>
          </defs>
          {visitsByDay.map((day, index) => {
            const barHeight = Math.max((day.visits / max) * innerHeight, 2);
            const x = PADDING_X + index * barWidth;
            const y = PADDING_Y + (innerHeight - barHeight);
            const isActive = activeIndex === index;
            return (
              <rect
                key={day.date}
                x={x + 1}
                y={y}
                width={Math.max(barWidth - 2, 1)}
                height={barHeight}
                rx={2}
                fill={isActive ? "#4B3F72" : `url(#${gradientId})`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                tabIndex={0}
                role='img'
                aria-label={`${day.date}: ${day.visits}`}
              />
            );
          })}
        </svg>
      </div>
      <div className='mt-1 flex justify-between text-[11px] text-studio-violet/50'>
        <span>{visitsByDay[0]?.date.slice(5)}</span>
        <span>{visitsByDay[visitsByDay.length - 1]?.date.slice(5)}</span>
      </div>
      {active && (
        <p className='mt-2 text-center text-xs text-studio-violet/70'>
          {t("trend.tooltip", { date: active.date, visits: active.visits })}
        </p>
      )}
    </div>
  );
}

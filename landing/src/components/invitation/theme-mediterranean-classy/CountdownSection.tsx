"use client";

import { useEffect, useState } from "react";

import { PaperTexture, Petal } from "./ui";

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function remainingUntil(target: number): Remaining {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1_000) % 60,
  };
}

const UNITS: Array<[keyof Remaining, string]> = [
  ["days", "Jours"],
  ["hours", "Heures"],
  ["minutes", "Min"],
  ["seconds", "Sec"],
];

/**
 * "Jour J dans" — four figures on a translucent plate over the paper texture.
 * Rendered as zeroes on the server so the markup is stable, then filled in on
 * mount; the mock's plate has hairline separators between the columns.
 */
export function CountdownSection({ weddingDateISO }: { weddingDateISO: string }) {
  const target = new Date(`${weddingDateISO}T00:00:00`).getTime();
  const [left, setLeft] = useState<Remaining | null>(null);

  useEffect(() => {
    setLeft(remainingUntil(target));
    const id = setInterval(() => setLeft(remainingUntil(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <section className="relative isolate overflow-hidden bg-mc-cream px-6 pb-20 pt-4">
      <PaperTexture strength="page" />
      <Petal variant={5} className="-left-14 top-4" size={150} rotate={-25} />
      <Petal variant={7} className="-right-10 bottom-8" size={140} rotate={35} flip />

      <h2 className="relative z-10 text-center font-mc-serif text-[24px] uppercase tracking-[0.12em] text-mc-green md:text-[30px]">
        Jour J dans
      </h2>

      <div className="relative z-10 mx-auto mt-6 flex max-w-[340px] items-stretch bg-white/55 py-4 shadow-mc-card backdrop-blur-[1px] md:mt-8 md:max-w-[520px] md:py-6">
        {UNITS.map(([key, label], i) => (
          <div
            key={key}
            className={`flex-1 text-center ${i > 0 ? "border-l border-mc-sage/40" : ""}`}
          >
            <p className="font-mc-numeric text-[40px] font-light leading-none text-mc-green md:text-[56px]">
              {String(left ? left[key] : 0).padStart(key === "days" ? 1 : 2, "0")}
            </p>
            <p className="mt-2 font-mc-sans text-[14px] uppercase tracking-[0.16em] text-mc-sage md:mt-3 md:text-[16px]">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

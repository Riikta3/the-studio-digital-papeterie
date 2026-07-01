"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Static data — not translated (exception i18n documentée dans la spec)
const TESTIMONIALS = [
  {
    names: "Sarah & Thomas",
    date: "Mariés en Juin 2024",
    text: "Nos invités ont été bluffés par l'animation de l'enveloppe ! C'est le détail qui a tout changé. La gestion des RSVP nous a sauvé un temps précieux.",
  },
  {
    names: "Élodie & Marc",
    date: "Mariés en Septembre 2024",
    text: "Enfin un site de mariage qui ne ressemble pas à un blog des années 2000. C'est chic, épuré et très facile à modifier. Le service client est adorable.",
  },
  {
    names: "Juliette & Pierre",
    date: "Mariés en Août 2024",
    text: "Nous avions un mariage à l'étranger et la fonctionnalité multilingue était indispensable. Tout a fonctionné parfaitement. Merci !",
  },
];

export function Testimonials() {
  const t = useTranslations("Testimonials");
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => setCurrent(index);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(next, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, next]);

  const testimonial = TESTIMONIALS[current];

  return (
    <section
      id="temoignages"
      className="py-24 bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3">
            {t("eyebrow")}
          </p>
          <span className="inline-block border border-primary/20 text-primary text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            {t("badge")}
          </span>
          <h2 className="font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight">
            {t("title")}{" "}
            <span className="italic text-primary">{t("titleAccent")}</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 md:gap-8">
          <button
            onClick={prev}
            className="p-3 rounded-full border border-primary/20 text-primary/40 hover:text-primary hover:border-primary/40 transition-colors hidden md:flex items-center justify-center shrink-0"
            aria-label="Témoignage précédent"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-2xl mx-auto text-center relative flex-1">
            <div className="font-heading text-[80px] text-primary/15 leading-none select-none absolute -top-4 left-0">
              "
            </div>
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative z-10 px-8"
            >
              <p className="font-heading text-xl md:text-2xl italic text-foreground/80 leading-relaxed mb-8">
                {testimonial.text}
              </p>
              <div className="flex flex-col items-center gap-1">
                <div className="flex gap-0.5 text-primary mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-sm">★</span>
                  ))}
                </div>
                <p className="font-heading italic text-primary font-medium">
                  {testimonial.names}
                </p>
                <p className="text-xs text-muted-foreground">{testimonial.date}</p>
              </div>
            </motion.div>
          </div>

          <button
            onClick={next}
            className="p-3 rounded-full border border-primary/20 text-primary/40 hover:text-primary hover:border-primary/40 transition-colors hidden md:flex items-center justify-center shrink-0"
            aria-label="Témoignage suivant"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Dots navigation — pause on hover/focus (WCAG 2.2.2) */}
        <div className="flex justify-center gap-3 mt-10">
          <button
            onClick={prev}
            className="p-2 text-primary/40 hover:text-primary transition-colors md:hidden"
            aria-label="Témoignage précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Témoignage ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-6 h-2 bg-primary"
                    : "w-2 h-2 bg-primary/20 hover:bg-primary/40"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="p-2 text-primary/40 hover:text-primary transition-colors md:hidden"
            aria-label="Témoignage suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

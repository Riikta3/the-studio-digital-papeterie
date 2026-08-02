"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, useState } from "react";

import type { FaqEntry } from "@/lib/mediterranean-demo-data";

import { Reveal } from "./Reveal";
import { Container, PaperTexture, Petal, SectionTitle } from "./ui";

/**
 * FAQ accordion. The mock shows the first entry open: the toggle is filled
 * green with a minus, outlined with a plus when closed. The panel animates on
 * height so the card grows rather than snapping.
 */
export function FaqSection({ entries }: { entries: readonly FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const reduced = useReducedMotion();
  const baseId = useId();

  return (
    <section className="relative isolate overflow-hidden bg-mc-cream px-4 py-20">
      <PaperTexture strength="page" />
      <Petal variant={4} className="-left-14 top-[38%]" size={160} rotate={30} />

      <Reveal>
        <SectionTitle title="FAQ" rule={false} />
      </Reveal>

      <Container size="narrow" className="relative z-10 mt-10 space-y-5 md:mt-14">
        {entries.map((entry, i) => {
          const open = openIndex === i;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <Reveal key={entry.question} delay={i * 0.06}>
              <div className="relative isolate overflow-hidden bg-mc-card shadow-mc-card">
                <PaperTexture />
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-mc-green"
                >
                  <span className="flex-1 font-mc-serif text-[18px] leading-snug text-mc-green md:text-[22px]">
                    {entry.question}
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-mc-green text-[18px] leading-none transition-colors duration-300 ${
                      open ? "bg-mc-green text-mc-cream" : "text-mc-green"
                    }`}
                  >
                    {open ? "−" : "+"}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      id={panelId}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: reduced ? 0 : 0.35,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-6 font-mc-sans text-[16px] leading-relaxed text-mc-green md:px-7 md:text-[17px]">
                        {entry.answer}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </Container>
    </section>
  );
}

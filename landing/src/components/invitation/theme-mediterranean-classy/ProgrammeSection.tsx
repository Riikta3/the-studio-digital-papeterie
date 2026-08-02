import Image from "next/image";

import type { ProgrammeDay, TimelineEntry } from "@/lib/mediterranean-demo-data";

import { Reveal } from "./Reveal";
import { Container, PaperTexture, Petal, Rule, SectionTitle } from "./ui";

/**
 * Dashed connector between two timeline entries, with a single node at its
 * midpoint — one dot per junction rather than one at each end, which used to
 * double up where two connectors met.
 */
function Connector() {
  return (
    <div aria-hidden className="relative mx-auto flex h-24 w-px justify-center">
      <span className="absolute inset-0 border-l border-dashed border-mc-sage" />
      <span className="absolute top-1/2 h-2 w-2 -translate-x-[3.5px] -translate-y-1/2 rounded-full bg-mc-sage" />
    </div>
  );
}

function Entry({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="text-center">
      <Image
        src={entry.image}
        alt=""
        width={1400}
        height={1050}
        className={
          entry.cutout
            ? "mx-auto h-auto w-[85%] object-contain"
            : "h-auto w-full object-cover"
        }
      />
      <p className="mt-8 font-mc-numeric text-[40px] font-semibold leading-none text-mc-green md:mt-10 md:text-[56px]">
        {entry.time}
      </p>
      <p className="mt-3 font-mc-sans text-[18px] tracking-[0.06em] text-mc-sage md:text-[20px]">
        {entry.label}
      </p>
    </div>
  );
}

/**
 * "Le Programme": one block per day, each an alternating run of full-bleed
 * watercolours and time slots joined by a dashed vertical connector.
 */
export function ProgrammeSection({ days }: { days: readonly ProgrammeDay[] }) {
  return (
    <section className="relative isolate overflow-hidden bg-mc-cream pb-20 pt-10">
      <PaperTexture strength="page" />
      <Petal variant={3} className="-left-16 top-40" size={160} rotate={-30} />
      <Petal variant={2} className="-right-14 top-[30%]" size={180} rotate={20} flip />
      <Petal variant={6} className="-left-12 bottom-[20%]" size={150} rotate={45} />

      <Reveal>
        <SectionTitle title="Le Programme" subtitle="Deux jours d'exception" />
      </Reveal>

      <Container>
        {days.map((day, dayIndex) => (
          <div key={day.title} className={dayIndex === 0 ? "mt-10" : "mt-16"}>
            {dayIndex > 0 ? <Rule className="mb-10" /> : null}

            <div className="relative z-10 text-center">
              <h3 className="font-mc-serif text-[32px] font-semibold uppercase tracking-[0.04em] text-mc-green md:text-[42px]">
                {day.title}
              </h3>
              <p className="mt-2 font-mc-sans text-[18px] tracking-[0.06em] text-mc-sage md:text-[20px]">
                {day.date}
              </p>
            </div>

            <div className="relative z-10 mt-8 md:mt-12">
              {day.entries.map((entry, i) => (
                <div key={entry.time}>
                  {i > 0 ? <Connector /> : null}
                  <Reveal>
                    <Entry entry={entry} />
                  </Reveal>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}

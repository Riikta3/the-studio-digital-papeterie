import Image from "next/image";

import type { Accommodation } from "@/lib/mediterranean-demo-data";

import { Reveal } from "./Reveal";
import { assets } from "./tokens";
import {
  Container,
  OptionsButton,
  PaperTexture,
  Petal,
  RouteButton,
  SectionTitle,
} from "./ui";

function AccommodationCard({ item }: { item: Accommodation }) {
  return (
    // Column layout so the CTA block bottom-aligns across the md grid, whatever
    // the number of lines the hotel name takes.
    <article className="flex flex-col bg-mc-card shadow-mc-card-dark">
      <Image
        src={item.image}
        alt={`${item.name}, ${item.city}`}
        width={1100}
        height={1650}
        className="h-52 w-full object-cover md:h-64"
      />
      <div className="relative isolate flex flex-1 flex-col px-6 py-6 md:px-8 md:py-8">
        <PaperTexture />
        <h3 className="flex flex-wrap items-baseline gap-x-3 font-mc-serif text-[32px] font-semibold text-mc-green md:text-[36px]">
          {item.name}
          <span className="font-mc-sans text-[18px] font-normal text-mc-ink">
            {item.city}
          </span>
        </h3>
        <p className="mt-2 font-mc-sans text-[16px] uppercase tracking-[0.08em] text-mc-sage">
          {item.distance}
        </p>

        <RouteButton className="mt-6 md:mt-auto md:pt-6">Je réserve</RouteButton>

        {item.bookingCode ? (
          <p className="mt-5 text-center font-mc-sans text-[16px] font-semibold uppercase tracking-[0.06em] text-mc-green">
            -10% avec le code {item.bookingCode}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/** "Hébergements": stone-wall backdrop, one card per hotel, then the CTA. */
export function AccommodationSection({ items }: { items: readonly Accommodation[] }) {
  return (
    <section className="relative isolate overflow-hidden px-4 py-20">
      <Image
        src={assets.textureStoneWall}
        alt=""
        width={1086}
        height={1448}
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60"
      />
      <span aria-hidden className="absolute inset-0 -z-10 bg-mc-cream/40" />

      <Petal variant={2} className="-left-16 top-[45%]" size={170} rotate={-35} />

      <Reveal>
        <SectionTitle title="Hébergements" subtitle="Sélectionnés pour vous" />
      </Reveal>

      <Container className="relative z-10 mt-10 grid gap-10 md:mt-14 md:grid-cols-2 md:gap-8">
        {items.map((item, i) => (
          <Reveal key={item.name} delay={i * 0.1} className="flex">
            <AccommodationCard item={item} />
          </Reveal>
        ))}
      </Container>

      <div className="relative z-10 mt-10 flex justify-center md:mt-14">
        <OptionsButton>Voir plus d&apos;options</OptionsButton>
      </div>
    </section>
  );
}

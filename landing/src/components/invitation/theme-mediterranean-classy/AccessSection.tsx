import Image from "next/image";

import type { MEDITERRANEAN_DEMO } from "@/lib/mediterranean-demo-data";

import { Reveal } from "./Reveal";
import { ArchCard, PaperTexture, Petal, RouteButton } from "./ui";

type Venue = (typeof MEDITERRANEAN_DEMO)["venue"];

/** "Accès & itinéraires": the arch card, with the map and the two route CTAs. */
export function AccessSection({ venue }: { venue: Venue }) {
  return (
    <section className="relative isolate overflow-hidden bg-mc-cream px-4 pb-16">
      <PaperTexture strength="page" />
      <Petal variant={1} className="-right-14 bottom-[18%]" size={170} rotate={-20} flip />

      <Reveal>
        <ArchCard eyebrow="Accès" title="& Itinéraires">
        <h3 className="text-center font-mc-serif text-[32px] font-semibold text-mc-green md:text-[38px]">
          {venue.name}
        </h3>
        <p className="mt-2 text-center font-mc-sans text-[16px] tracking-[0.04em] text-mc-sage">
          {venue.address}
        </p>

        <Image
          src={venue.mapImage}
          alt={`Carte situant ${venue.name}`}
          width={1086}
          height={1448}
          className="mx-auto mt-6 h-auto w-full shadow-mc-card"
        />

        <div className="mt-8 space-y-6 text-center">
          {venue.access.map((mode) => (
            <div key={mode.mode}>
              <p className="font-mc-serif text-[18px] text-mc-green">{mode.mode}</p>
              {mode.details.map((line) => (
                <p
                  key={line}
                  className="mt-1 font-mc-sans text-[16px] tracking-[0.04em] text-mc-sage"
                >
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          <RouteButton href={venue.wazeUrl}>Voir sur Waze</RouteButton>
          <RouteButton href={venue.googleMapsUrl}>
            Voir sur Google Maps
          </RouteButton>
        </div>
        </ArchCard>
      </Reveal>
    </section>
  );
}

import Image from "next/image";

import type { PlaylistSuggestion } from "@/lib/mediterranean-demo-data";

import { assets } from "./tokens";
import { Reveal } from "./Reveal";
import { Container, Petal, Rule, SuggestButton } from "./ui";

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="14"
      viewBox="0 0 12 14"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M11 1 4 2.6v7.1a2.2 2.2 0 1 0 1 1.8V4.3l5-1.1v4.9a2.2 2.2 0 1 0 1 1.8V1Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * "Playlist participative": the dark sage embossed panel, a suggestion field
 * and the list of songs already proposed. Static in this preview — the field
 * and button are not wired to a backend yet.
 */
export function PlaylistSection({
  intro,
  suggestions,
}: {
  intro: string;
  suggestions: readonly PlaylistSuggestion[];
}) {
  return (
    <section className="relative isolate overflow-hidden px-8 py-16">
      <Image
        src={assets.paperFrameSage}
        alt=""
        width={941}
        height={1672}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      <Petal variant={0} className="-right-10 top-[28%]" size={200} rotate={-10} flip />

      <Container size="narrow" className="relative z-10 text-center">
        <h2 className="font-mc-serif text-[40px] font-semibold uppercase leading-none tracking-[0.02em] text-mc-olive md:text-[52px]">
          Playlist
        </h2>
        <p className="mt-3 font-mc-sans text-[18px] uppercase tracking-[0.14em] text-white">
          Participative
        </p>
        <Rule className="mt-5 bg-white/50" />
        <p className="mx-auto mt-6 max-w-[280px] font-mc-sans text-[18px] leading-relaxed text-white">
          {intro}
        </p>
      </Container>

      <Container size="narrow" className="relative z-10 mt-10 md:mt-14">
        <p className="font-mc-serif text-[18px] text-mc-olive">Votre suggestion</p>
        <div className="mt-3 flex items-center gap-2 border-b border-white/50 pb-2">
          <NoteIcon className="shrink-0 text-white/70" />
          <input
            type="text"
            placeholder="Titre – Artiste"
            aria-label="Titre et artiste"
            className="w-full bg-transparent font-mc-serif text-[18px] text-white placeholder:text-white/60 focus:outline-none"
          />
        </div>
        <div className="mt-6">
          <SuggestButton>Ajouter à la playlist</SuggestButton>
        </div>
      </Container>

      <h3 className="relative z-10 mt-12 text-center font-mc-serif text-[32px] text-mc-olive md:mt-16 md:text-[40px]">
        Déjà proposés
      </h3>

      <ul className="relative z-10 mx-auto mt-5 w-full max-w-[430px] bg-mc-card/95 md:max-w-[560px]">
        {suggestions.map((song, i) => (
          <li
            key={`${song.title}-${song.artist}`}
            className={`flex items-center gap-3 px-4 py-4 ${i > 0 ? "border-t border-mc-sage/40" : ""}`}
          >
            <NoteIcon className="shrink-0 text-mc-border" />
            <span className="font-mc-serif text-[16px] text-mc-ink md:text-[18px]">
              {song.title} – {song.artist}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

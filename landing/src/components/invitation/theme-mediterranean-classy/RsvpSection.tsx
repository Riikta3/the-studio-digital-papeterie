import type { MEDITERRANEAN_DEMO } from "@/lib/mediterranean-demo-data";

import { Reveal } from "./Reveal";
import { ArchCard, PaperTexture, Petal, RouteButton } from "./ui";

type Rsvp = (typeof MEDITERRANEAN_DEMO)["rsvp"];

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="font-mc-sans text-[16px] uppercase tracking-[0.12em] text-mc-green">
      {children}
    </p>
  );
}

function RadioGroup({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: readonly string[];
}) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-3 space-y-3">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name={name}
              value={option}
              className="h-4 w-4 shrink-0 appearance-none rounded-full border border-mc-sage transition-colors checked:border-[5px] checked:border-mc-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-green"
            />
            <span className="font-mc-sans text-[18px] text-mc-green">{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * RSVP form inside the arch card. Presentational only in this preview — the
 * live theme will post to the existing `submitRsvp` server action.
 */
export function RsvpSection({ rsvp }: { rsvp: Rsvp }) {
  return (
    // z-10 so the card's arched foot sits over the footer photograph.
    <section className="relative isolate z-10 overflow-hidden bg-mc-cream px-4 pt-8">
      <PaperTexture strength="page" />
      <Petal variant={5} className="-left-12 top-[15%]" size={150} rotate={-45} />

      <Reveal>
        <ArchCard eyebrow="RSVP" title="Votre présence compte">
        <p className="text-center font-mc-sans text-[18px] leading-relaxed text-mc-green">
          {rsvp.intro}
        </p>

        <form className="mt-8 space-y-8">
          <RadioGroup name="attendance" label="Présence" options={rsvp.attendance} />
          <RadioGroup name="party" label="Qui sera présent ?" options={rsvp.party} />

          <div>
            <FieldLabel>Restrictions alimentaires</FieldLabel>
            <select
              aria-label="Restrictions alimentaires"
              defaultValue=""
              className="mt-3 w-full appearance-none border-b border-mc-sage bg-transparent pb-2 font-mc-serif text-[18px] text-mc-ink focus:border-mc-green focus:outline-none"
            >
              <option value="" disabled>
                Sélectionner
              </option>
              {rsvp.dietaryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel>Allergies</FieldLabel>
            <textarea
              rows={3}
              aria-label="Allergies"
              placeholder="Crustacé"
              className="mt-3 w-full border border-mc-sage bg-transparent p-3 font-mc-serif text-[18px] text-mc-ink placeholder:text-mc-ink/60 focus:border-mc-green focus:outline-none"
            />
          </div>

          <p className="text-center font-mc-sans text-[16px] font-semibold text-mc-green">
            {rsvp.deadlineLabel}
          </p>

          <RouteButton type="submit">Envoyer ma réponse</RouteButton>
        </form>
        </ArchCard>
      </Reveal>
    </section>
  );
}

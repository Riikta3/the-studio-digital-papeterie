"use client";

import { Button } from "@shared/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { FadeIn } from "./FadeIn";

const STEPS = [
  {
    number: "1.",
    title: "L'Atelier",
    description:
      "Un échange visio ou téléphonique avec notre directeur artistique pour comprendre votre histoire, vos envies, votre univers et ce qui rend votre mariage unique.",
  },
  {
    number: "2.",
    title: "L'Esquisse",
    description:
      "Un moodboard sur-mesure est créé pour valider ensemble l'ambiance, les codes et l'esthétique de votre invitation.",
  },
  {
    number: "3.",
    title: "Le Design",
    description:
      "Place à la création. Votre faire-part prend vie dans un design exclusif, pensé dans les moindres détails.",
  },
  {
    number: "4.",
    title: "Le Lancement",
    description:
      "Votre invitation est prête. Un lien unique, prêt à être partagé instantanément avec vos invités.",
  },
];

export function Atelier() {
  return (
    <section className="relative overflow-hidden bg-studio-violet px-6 py-20 md:px-12">
      <Image
        src="/images/hero-leaf-bottom.svg"
        alt=""
        width={141}
        height={188}
        className="pointer-events-none absolute -bottom-10 left-0 h-auto w-32 md:w-40"
      />

      <div className="mx-auto max-w-2xl">
        <FadeIn>
          <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-lavande">
            <Image
              src="/images/eyebrow-separator-left.svg"
              alt=""
              width={42}
              height={1}
            />
            <span>Confiez votre vision à notre Studio</span>
            <Image
              src="/images/eyebrow-separator-right.svg"
              alt=""
              width={42}
              height={1}
            />
          </div>

          <h2 className="mt-4 text-center font-heading text-h1">
            <span className="block text-white">Un faire-part</span>
            <span className="block text-studio-lavande">aussi unique</span>
            <span className="block text-studio-jaune">que votre histoire</span>
          </h2>

          <p className="mx-auto mt-6 max-w-md text-center font-body text-sm text-white/80 md:text-base">
            Vous avez une vision. Nous lui donnons vie. Notre Studio conçoit
            votre invitation digitale avec précision, goût et intention pour
            refléter l'essence de votre mariage.
          </p>
        </FadeIn>

        <div className="mt-14 flex flex-col gap-12">
          {STEPS.map((step) => (
            <FadeIn key={step.number}>
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-studio-jaune font-heading text-3xl text-studio-violet">
                  {step.number}
                </span>
                <h3 className="font-heading text-h2 text-studio-jaune">
                  {step.title}
                </h3>
              </div>
              <p className="mt-4 font-body text-sm text-white/80 md:text-base">
                {step.description}
              </p>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-12 flex justify-center">
          <Button variant="studio-jaune" size="pill">
            Prendre rendez-vous <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}

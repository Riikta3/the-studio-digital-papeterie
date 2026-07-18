"use client";

import { Button } from "@shared/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { FadeIn } from "./FadeIn";

export function Pricing() {
  return (
    <section className="relative overflow-hidden bg-studio-violet px-6 py-20 md:px-12">
      <Image
        src="/images/hero-leaf-bottom.svg"
        alt=""
        width={141}
        height={188}
        className="pointer-events-none absolute bottom-0 right-0 h-auto w-24 md:w-32"
      />

      <div className="mx-auto max-w-3xl text-center">
        <FadeIn>
          <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-lavande">
            <Image
              src="/images/eyebrow-separator-left.svg"
              alt=""
              width={42}
              height={1}
            />
            <span>Pour 150 invités</span>
            <Image
              src="/images/eyebrow-separator-right.svg"
              alt=""
              width={42}
              height={1}
            />
          </div>

          <h2 className="mt-4 font-heading text-h1 text-white">
            La <span className="text-studio-jaune">différence</span>{" "}
            <span className="text-studio-lavande">qui compte</span>
          </h2>
        </FadeIn>

        <FadeIn className="mx-auto mt-10 grid max-w-xl grid-cols-2 gap-4 text-left">
          <div className="flex flex-col rounded-2xl border border-studio-lavande/50 p-5">
            <p className="font-body text-h5 tracking-luxe text-studio-lavande">
              Papier traditionnel
            </p>
            <p className="mt-4 font-heading text-3xl text-studio-lavande line-through md:text-4xl">
              645€
            </p>
            <p className="mt-4 font-body text-sm text-studio-lavande/80">
              Impression + timbres + enveloppes
            </p>
          </div>

          <div className="flex flex-col rounded-2xl bg-studio-jaune p-5 shadow-xl">
            <p className="font-body text-h5 tracking-luxe text-studio-violet">
              The Studio
            </p>
            <p className="mt-4 font-heading text-4xl text-studio-violet md:text-5xl">
              175€
            </p>
            <p className="mt-4 font-body text-sm text-studio-violet/80">
              Tout inclus, illimité
            </p>
          </div>
        </FadeIn>

        <FadeIn>
          <p className="mx-auto mt-10 max-w-md font-body text-sm text-white/80 md:text-base">
            Envoi instantané&nbsp;· Modifiable&nbsp;· RSVP intégré&nbsp;· Zéro
            papier
          </p>
        </FadeIn>

        <FadeIn className="mt-8 flex justify-center">
          <Button variant="studio-jaune" size="pill">
            Créer mon invitation <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </FadeIn>
      </div>
    </section>
  );
}

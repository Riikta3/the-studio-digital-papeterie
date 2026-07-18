"use client";

import { Button } from "@shared/components/ui/button";
import { ArrowRight } from "lucide-react";

import { FadeIn } from "./FadeIn";

export function FinalCta() {
  return (
    <div className="px-6 py-20 text-center md:px-12">
      <FadeIn>
        <h2 className="mx-auto max-w-xl font-heading text-h1 text-white">
          Le lieu est choisi, le traiteur aussi.
          <br />
          <span className="text-studio-jaune">Il reste le faire-part</span>
        </h2>

        <div className="mt-8 flex justify-center">
          <Button variant="studio-jaune" size="pill">
            Créer mon invitation <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </FadeIn>
    </div>
  );
}

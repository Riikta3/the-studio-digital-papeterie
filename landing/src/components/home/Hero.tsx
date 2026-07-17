"use client";

import { Button } from "@shared/components/ui/button";
import { SplitText } from "@shared/components/ui/split-text";
import { motion } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import Image from "next/image";

import { HeroCarousel } from "./HeroCarousel";

// Continuous word-by-word reveal: each block starts after the previous one's
// last word. Delay of a block = start of previous + (its word count × STAGGER).
const STAGGER = 0.2;
const START = 0.2;
const w = (text: string) => text.split(" ").length;

const D = (() => {
  const eyebrow = START;
  const title1 = eyebrow + w("Faire-part digital") * STAGGER;
  const title2 = title1 + w("Le faire-part") * STAGGER;
  const subtitle = title2 + w("réinventé") * STAGGER;
  const cta = subtitle + w("Pensé pour les mariages d'aujourd'hui") * STAGGER;
  return { eyebrow, title1, title2, subtitle, cta };
})();

export function Hero() {
  return (
    <div className="relative bg-studio-beurre">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-x-0 top-0 h-[80vh] overflow-hidden bg-studio-violet md:h-[800px]"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage: "url(/images/hero-texture.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center pt-8 md:pt-10">
        <nav className="flex w-full max-w-6xl items-center justify-between px-6 md:px-12">
          <Image src="/logo.svg" alt="The Studio Digital Papeterie" width={40} height={42} />
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        <div className="flex flex-col items-center px-6 md:px-12">
          <div className="mt-10 flex items-center gap-3 font-body text-h5 tracking-luxe text-studio-lavande md:mt-14">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: D.eyebrow, ease: "easeOut" }}
            >
              <Image
                src="/images/eyebrow-separator-left.svg"
                alt=""
                width={42}
                height={1}
              />
            </motion.div>
            <SplitText
              text="Faire-part digital"
              className="font-body"
              startDelay={D.eyebrow}
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: D.eyebrow + 2 * STAGGER,
                ease: "easeOut",
              }}
            >
              <Image
                src="/images/eyebrow-separator-right.svg"
                alt=""
                width={42}
                height={1}
              />
            </motion.div>
          </div>

          <h1 className="mt-6 text-center font-heading text-h1">
            <SplitText
              as="span"
              text="Le faire-part"
              className="block text-white"
              startDelay={D.title1}
            />
            <SplitText
              as="span"
              text="réinventé"
              className="block text-studio-jaune"
              startDelay={D.title2}
            />
          </h1>

          <SplitText
            as="p"
            text="Pensé pour les mariages d'aujourd'hui"
            className="mt-4 text-center font-body text-body-p text-white/80"
            startDelay={D.subtitle}
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: D.cta, ease: "easeOut" }}
            className="mt-8 flex flex-row gap-3 sm:gap-4"
          >
            <Button variant="studio-outline" size="pill">
              Découvrir
            </Button>
            <Button variant="studio-jaune" size="pill">
              Créer le mien <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        <div className="mt-4 w-full md:mt-20">
          <HeroCarousel />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4, ease: "easeOut" }}
          className="relative z-10 mt-4 w-full max-w-3xl px-6 md:px-12"
        >
          <Button
            variant="studio-violet"
            size="pill"
            className="w-full justify-center"
          >
            Tester le thème Dolce Vita <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

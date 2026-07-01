"use client";

import { Button } from "@shared/components/ui/button";
import { SplitText } from "@shared/components/ui/split-text";
import { motion } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import Image from "next/image";

import { HeroCarousel } from "./HeroCarousel";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: "easeOut" },
  }),
};

export function Hero() {
  return (
    <div className="relative bg-studio-jaune">
      <div className="absolute inset-x-0 top-0 h-[80vh] overflow-hidden bg-studio-violet md:h-[800px]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage: "url(/images/hero-texture.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 pt-8 md:px-12 md:pt-10">
        <nav className="flex w-full max-w-6xl items-center justify-between">
          <Image src="/logo.svg" alt="The Studio Digital Papeterie" width={40} height={42} />
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        <motion.div
          initial="hidden"
          animate="visible"
          className="mt-10 flex items-center gap-3 text-sm tracking-luxe text-studio-lavande md:mt-14"
        >
          <motion.span
            custom={0}
            variants={fadeUp}
            className="h-px w-8 bg-studio-lavande/50"
          />
          <motion.span custom={0.05} variants={fadeUp} className="font-body">
            Faire-part digital
          </motion.span>
          <motion.span
            custom={0.1}
            variants={fadeUp}
            className="h-px w-8 bg-studio-lavande/50"
          />
        </motion.div>

        <h1 className="mt-6 text-center font-heading text-5xl leading-tight md:text-7xl">
          <SplitText
            text="Le faire-part"
            className="block"
            staggerDelay={0.12}
            fromColor="rgba(255,255,255,0.25)"
            toColor="rgba(255,255,255,1)"
          />
          <SplitText
            text="réinventé"
            className="block"
            initialDelay={0.28}
            staggerDelay={0.12}
            fromColor="rgba(242,229,170,0.25)"
            toColor="#F2E5AA"
          />
        </h1>

        <motion.p
          initial="hidden"
          animate="visible"
          custom={0.65}
          variants={fadeUp}
          className="mt-4 text-center font-body text-lg text-white/80 md:text-xl"
        >
          Pensé pour les mariages d&apos;aujourd&apos;hui
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={0.8}
          variants={fadeUp}
          className="mt-8 flex flex-row gap-3 sm:gap-4"
        >
          <Button variant="studio-outline" size="pill">
            Découvrir
          </Button>
          <Button variant="studio-jaune" size="pill">
            Créer le mien <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>

        <div className="relative left-1/2 mt-16 w-screen -translate-x-1/2 md:mt-20">
          <HeroCarousel />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={1.4}
          variants={fadeUp}
          className="relative z-10 mt-12 w-full max-w-3xl"
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

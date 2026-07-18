"use client";

import { Button } from "@shared/components/ui/button";
import { SplitText } from "@shared/components/ui/split-text";
import { motion } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { HeroCarousel } from "./HeroCarousel";
import { MobileMenu } from "./MobileMenu";
import { TextureOverlay } from "./TextureOverlay";

// Continuous word-by-word reveal: each block starts after the previous one's
// last word. Delay of a block = start of previous + (its word count × STAGGER).
const STAGGER = 0.2;
const START = 0.2;
const w = (text: string) => text.split(" ").length;

export function Hero() {
  const t = useTranslations("Hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const eyebrowText = t("eyebrow");
  const title1Text = t("titleLine1");
  const subtitleText = t("subtitle");

  const D = (() => {
    const eyebrow = START;
    const title1 = eyebrow + w(eyebrowText) * STAGGER;
    const title2 = title1 + w(title1Text) * STAGGER;
    const subtitle = title2 + w(t("titleLine2")) * STAGGER;
    const cta = subtitle + w(subtitleText) * STAGGER;
    return { eyebrow, title1, title2, subtitle, cta };
  })();

  return (
    <div id="accueil" className="relative bg-studio-beurre">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute inset-x-0 top-0 h-[80vh] overflow-hidden bg-studio-violet md:h-[800px]"
      >
        <TextureOverlay />
        <Image
          src="/images/hero-leaf-top.svg"
          alt=""
          width={82}
          height={138}
          className="pointer-events-none absolute right-0 top-16 h-auto w-24 md:top-24 md:w-40"
        />
        <Image
          src="/images/hero-leaf-bottom.svg"
          alt=""
          width={106}
          height={188}
          className="pointer-events-none absolute bottom-56 left-2 h-auto w-28 md:bottom-24 md:left-12 md:w-44"
        />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center pt-8 md:pt-10">
        <nav className="flex w-full max-w-6xl items-center justify-between px-6 md:px-12">
          <Image src="/logo.svg" alt="The Studio Digital Papeterie" width={40} height={42} />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t("menuAriaLabel")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>

        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

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
              text={eyebrowText}
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
              text={title1Text}
              className="block text-white"
              startDelay={D.title1}
            />
            <SplitText
              as="span"
              text={t("titleLine2")}
              className="block text-studio-jaune"
              startDelay={D.title2}
            />
          </h1>

          <SplitText
            as="p"
            text={subtitleText}
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
              {t("discoverButton")}
            </Button>
            <Button variant="studio-jaune" size="pill">
              {t("createButton")} <ArrowRight className="ml-2 h-4 w-4" />
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
          className="relative z-10 mt-4 flex w-full justify-center px-6 md:px-12"
        >
          <Button
            variant="studio-violet"
            size="pill"
            className="text-studio-jaune"
          >
            {t("themeCta")} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

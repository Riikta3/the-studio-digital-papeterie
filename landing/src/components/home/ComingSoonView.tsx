"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Link } from "@/navigation";

import { ComingSoonLanguageSwitcher } from "./ComingSoonLanguageSwitcher";
import { LOGO_PATH, LOGO_VIEWBOX } from "./logo-path";
import { TextureOverlay } from "./TextureOverlay";

// One orchestrated moment, same grammar as `NotFoundView`: the card settles
// onto the table, then the wax seal is pressed onto it. Nothing here opens —
// that is the whole point of the page.
const CARD_IN = 0.25;
const COPY_IN = 0.45;
const SEAL_PRESS = 1.05;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// Height of the monogram inside the seal, in the seal's own 200-unit viewBox.
// Deliberately short of the inner rim (r=66): the mark needs visible wax
// around it to read as struck into the seal rather than filling it.
const MARK_HEIGHT = 78;

/**
 * The wax seal closing the card — the one loud element on the page.
 * Drawn as SVG rather than shipped as a flat asset so the studio's monogram
 * and the wax around it share one displacement filter, and the rim keeps the
 * uneven edge of something pressed by hand. The mark carries the seal alone —
 * no ring text around it.
 */
function WaxSeal({ label }: { label: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      role="img"
      aria-label={label}
    >
      <defs>
        {/* Wax is thicker at one edge than the other, and catches the light
            off-centre. */}
        <radialGradient id="seal-wax" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#7560B1" />
          <stop offset="55%" stopColor="#584984" />
          <stop offset="100%" stopColor="#3B3159" />
        </radialGradient>
        {/* Displacement only, never a mask: the wax can wobble at the rim but
            can't be knocked out entirely. */}
        <filter id="seal-edge" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="3"
            seed="11"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <g filter="url(#seal-edge)">
        <circle cx="100" cy="100" r="84" fill="url(#seal-wax)" />
        {/* The pressed rim: a lighter lip where the stamp pushed the wax out. */}
        <circle
          cx="100"
          cy="100"
          r="76"
          fill="none"
          stroke="#B7AFD1"
          strokeWidth="2"
          opacity="0.45"
        />
        <circle
          cx="100"
          cy="100"
          r="66"
          fill="none"
          stroke="#B7AFD1"
          strokeWidth="1"
          opacity="0.3"
        />

        {/* The studio's actual monogram, struck into the wax — same geometry
            as `/logo.svg`, composed inline so it sits under the same
            displacement filter as the wax around it. Scaled from the logo's
            47x49 box to MARK_HEIGHT and centred on both axes. */}
        <g
          transform={`translate(${100 - (MARK_HEIGHT * LOGO_VIEWBOX.width) / LOGO_VIEWBOX.height / 2}, ${100 - MARK_HEIGHT / 2}) scale(${MARK_HEIGHT / LOGO_VIEWBOX.height})`}
        >
          <path d={LOGO_PATH} fill="#F2E5AA" opacity="0.92" />
        </g>
      </g>
    </svg>
  );
}

export function ComingSoonView({ year }: { year: number }) {
  const t = useTranslations("ComingSoon");
  const reduce = useReducedMotion() ?? false;

  // Same reason as `NotFoundView`: on a page whose entrance must not flash the
  // finished scene, Framer's mount-time `initial → animate` is unreliable
  // behind hydration. Driving it from state flipped in an effect makes it a
  // real state change, which always animates.
  const [entered, setEntered] = useState(false);
  const [sealed, setSealed] = useState(false);
  useEffect(() => {
    setEntered(true);
    const id = setTimeout(() => setSealed(true), reduce ? 0 : SEAL_PRESS * 1000);
    return () => clearTimeout(id);
  }, [reduce]);

  const d = (beat: number) => (reduce ? 0 : beat);

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-studio-violet">
      <TextureOverlay />

      <Image
        src="/images/leaf-top-lavande.svg"
        alt=""
        width={82}
        height={138}
        className="pointer-events-none absolute right-0 top-14 h-auto w-20 opacity-60 md:top-20 md:w-32"
      />
      <Image
        src="/images/leaf-bottom-lavande.svg"
        alt=""
        width={106}
        height={188}
        className="pointer-events-none absolute -left-4 bottom-8 h-auto w-24 opacity-50 md:left-0 md:w-36"
      />

      {/* Above the two siblings below it, not merely `z-10` like them: at
          equal z-index the later elements in the DOM win, and the content
          block was painting over the open language panel — the menu was
          visible but every click on it landed on the content div instead. */}
      <div className="relative z-30 flex w-full flex-col items-center pt-8 md:pt-10">
        <nav className="flex w-full max-w-6xl items-center justify-between px-8 md:px-12">
          <Link href="/" aria-label={t("homeAriaLabel")}>
            <Image
              src="/logo.svg"
              alt="The Studio Digital Papeterie"
              width={40}
              height={42}
            />
          </Link>
          <ComingSoonLanguageSwitcher />
        </nav>
      </div>

      <div
        // Hidden in the server markup and revealed on mount, so the finished
        // scene never flashes before the entrance plays. `entered` is the same
        // flag that starts the animation, so reveal and motion stay in step.
        className={`relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-14 md:px-12 ${
          entered ? "" : "invisible"
        }`}
      >
        <motion.p
          className="font-body text-h5 tracking-supertitle text-studio-lavande"
          animate={entered ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: d(0.1), ease: EASE_OUT }}
        >
          {t("eyebrow")}
        </motion.p>

        {/* The card sits off-square from the first frame and keeps that angle:
            it is laid on the table, it does not straighten itself out. The
            tilt lives in `style`, outside anything Framer animates. */}
        <motion.div
          className="relative mt-9 w-[300px] rounded-[3px] bg-studio-beige px-7 pb-32 pt-14 md:mt-11 md:w-[400px] md:px-11 md:pb-40 md:pt-20"
          style={{
            boxShadow: "0 40px 70px -30px rgba(0,0,0,0.6)",
            rotate: -1.8,
          }}
          animate={
            entered ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : -26 }
          }
          transition={{ duration: 0.9, delay: d(CARD_IN), ease: EASE_OUT }}
        >
          {/* No paper-grain layer on the card: the stock reads as clean,
              flat stationery. The texture stays on the violet ground behind
              it, which is where the depth belongs. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[9px] border border-studio-pourpre/25"
          />

          <div className="relative text-center text-studio-violet/75">
            <p className="font-heading text-2xl leading-tight md:text-3xl">
              {t("cardTitle")}
            </p>
            <span
              aria-hidden
              className="mx-auto mt-6 block h-px w-16 bg-studio-pourpre/30"
            />
            <p className="mt-6 font-body text-[0.7rem] leading-relaxed md:text-xs">
              {t("cardLine")}
            </p>
          </div>

          {/* The seal is struck fully inside the card: the wax reads on the
              beige paper and disappears against the violet ground, so no part
              of the ring may overhang the edge — hence the bottom inset rather
              than a negative offset. Centred horizontally, low on the card,
              where a real envelope is closed. */}
          <motion.div
            className="pointer-events-none absolute bottom-3 left-1/2 h-[100px] w-[100px] origin-center md:bottom-4 md:h-[124px] md:w-[124px]"
            style={{ x: "-50%" }}
            animate={
              sealed
                ? { opacity: 1, scale: 1, rotate: -8 }
                : { opacity: 0, scale: 2.2, rotate: 4 }
            }
            // Tweened, not sprung: a spring interrupted by the hydration
            // hand-off settles wherever it happens to be, leaving a
            // half-scaled ghost. The overshoot is baked into the easing.
            transition={
              reduce
                ? { duration: 0 }
                : {
                    opacity: { duration: 0.1 },
                    scale: { duration: 0.38, ease: [0.34, 1.4, 0.64, 1] },
                    rotate: { duration: 0.38, ease: [0.34, 1.4, 0.64, 1] },
                  }
            }
          >
            <WaxSeal label={t("sealLabel")} />
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-20 max-w-md text-center md:mt-24"
          animate={
            entered ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 14 }
          }
          transition={{ duration: 0.7, delay: d(COPY_IN), ease: EASE_OUT }}
        >
          <h1 className="font-heading text-h2 leading-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-4 font-body text-body-p leading-relaxed text-studio-lavande">
            {t("subtitle")}
          </p>
          <p className="mt-8 font-body text-h5 tracking-luxe text-studio-jaune">
            {t("signature")}
          </p>
        </motion.div>
      </div>

      <p className="relative z-10 pb-8 text-center font-body text-xs text-white/40">
        {t("copyright", { year })}
      </p>
    </main>
  );
}

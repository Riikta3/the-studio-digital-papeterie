"use client";

import { Button } from "@shared/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Link } from "@/navigation";

import { MobileMenu } from "./MobileMenu";
import { TextureOverlay } from "./TextureOverlay";

// One orchestrated moment: the invitation card settles, then the postal stamp
// hits it. Everything else fades in quietly behind that beat.
const CARD_IN = 0.2;
const STAMP_HIT = 1.05;
const COPY_IN = 1.5;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * The "returned to sender" stamp — the one loud element on the page.
 * Drawn as SVG so the curved text really follows the ring, the way a postal
 * cancel does, and so the ink can sit slightly unevenly on the paper.
 */
function ReturnStamp({ label, code }: { label: string; code: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      role="img"
      aria-label={`${label} — ${code}`}
    >
      <defs>
        {/* The arc runs the full circle so long labels keep their first and
            last letters: a half-circle path drops whatever overflows it. */}
        <path
          id="stamp-arc-top"
          d="M 100 100 m 0 -68 a 68 68 0 1 1 -0.1 0"
          fill="none"
        />
        <path
          id="stamp-arc-bottom"
          d="M 100 100 m 0 58 a 58 58 0 1 0 -0.1 0"
          fill="none"
        />
        {/* Uneven ink: the strokes wobble slightly, the way a rubber stamp
            presses unevenly onto paper. Displacement only — never a mask, so
            the stamp can't be knocked out entirely. */}
        <filter id="stamp-ink" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.045"
            numOctaves="4"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <g
        filter="url(#stamp-ink)"
        fill="none"
        stroke="#4B3F72"
        strokeWidth="3"
        opacity="0.9"
      >
        <circle cx="100" cy="100" r="88" />
        <circle cx="100" cy="100" r="79" strokeWidth="1.5" />

        <text
          fill="#4B3F72"
          stroke="none"
          fontFamily="var(--font-body), sans-serif"
          fontSize="15"
          fontWeight="600"
          letterSpacing="2"
        >
          <textPath href="#stamp-arc-top" startOffset="25%" textAnchor="middle">
            {label}
          </textPath>
        </text>

        <text
          fill="#4B3F72"
          stroke="none"
          fontFamily="var(--font-body), sans-serif"
          fontSize="11"
          fontWeight="500"
          letterSpacing="3"
        >
          <textPath
            href="#stamp-arc-bottom"
            startOffset="75%"
            textAnchor="middle"
          >
            {code}
          </textPath>
        </text>

        <line x1="44" y1="100" x2="68" y2="100" strokeWidth="2" />
        <line x1="132" y1="100" x2="156" y2="100" strokeWidth="2" />
        <text
          x="100"
          y="113"
          fill="#4B3F72"
          stroke="none"
          textAnchor="middle"
          fontFamily="var(--font-heading), serif"
          fontSize="42"
        >
          404
        </text>
      </g>
    </svg>
  );
}

export function NotFoundView() {
  const t = useTranslations("NotFound");
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion() ?? false;

  // Rendered through `not-found.tsx`, Framer's mount-time `initial → animate`
  // never fires: the SSR markup keeps `opacity: 0` and nothing takes over on
  // the client. Driving the sequence from a state flipped in an effect makes
  // it a real state change, which does animate.
  const [entered, setEntered] = useState(false);
  useEffect(() => setEntered(true), []);

  const d = (beat: number) => (reduce ? 0 : beat);

  return (
    <main className="relative flex min-h-[100svh] flex-col overflow-hidden bg-studio-violet">
      <TextureOverlay />

      <Image
        src="/images/hero-leaf-top.svg"
        alt=""
        width={82}
        height={138}
        className="pointer-events-none absolute right-0 top-16 h-auto w-20 opacity-70 md:top-24 md:w-32"
      />

      <div className="relative z-10 flex w-full flex-col items-center pt-8 md:pt-10">
        <nav className="flex w-full max-w-6xl items-center justify-between px-6 md:px-12">
          <Link href="/" aria-label={t("homeAriaLabel")}>
            <Image
              src="/logo.svg"
              alt="The Studio Digital Papeterie"
              width={40}
              height={42}
            />
          </Link>
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
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 md:px-12">
        {/* The card, laid slightly off-square as if dropped on a table */}
        <motion.div
          className="relative w-[268px] rounded-[3px] bg-studio-beige px-7 py-10 md:w-[340px] md:px-9 md:py-14"
          style={{ boxShadow: "0 40px 70px -30px rgba(0,0,0,0.6)" }}
          animate={
            entered
              ? { opacity: 1, y: 0, rotate: -2.5 }
              : { opacity: 0, y: reduce ? 0 : -28, rotate: -4.5 }
          }
          transition={{ duration: 0.9, delay: d(CARD_IN), ease: EASE_OUT }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[3px] opacity-50 mix-blend-multiply"
            style={{
              backgroundImage: "url(/images/hero-texture.png)",
              backgroundSize: "cover",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[9px] border border-studio-pourpre/25"
          />

          {/* What the card was carrying, now cancelled. No couple's name here:
              this is the studio's own stationery, not somebody's invitation. */}
          <div className="relative text-center text-studio-violet/45">
            <p className="font-heading text-xl leading-tight md:text-2xl">
              {t("cardTitle")}
            </p>
            <p className="mt-4 font-body text-[0.7rem] leading-relaxed md:text-xs">
              {t("cardLine")}
            </p>
            <p className="mt-6 font-body text-[0.6rem] tracking-luxe md:text-[0.65rem]">
              {t("cardFooter")}
            </p>
          </div>

          {/* The stamp: struck onto the card, overhanging its edge */}
          <motion.div
            className="pointer-events-none absolute -right-6 top-1/2 h-[150px] w-[150px] md:-right-9 md:h-[190px] md:w-[190px]"
            animate={
              entered
                ? {
                    opacity: 1,
                    scale: reduce ? 1 : [2.6, 0.94, 1.03, 1],
                    rotate: 14,
                    y: "-50%",
                  }
                : {
                    opacity: 0,
                    scale: reduce ? 1 : 2.6,
                    rotate: reduce ? 14 : 26,
                    y: "-50%",
                  }
            }
            // Per-property transitions: `times` only applies to the keyframed
            // scale. Sharing one transition across a scalar opacity and a
            // 4-keyframe scale silently strands both at their initial value.
            transition={{
              opacity: { duration: 0.12, delay: d(STAMP_HIT) },
              scale: {
                duration: reduce ? 0 : 0.42,
                delay: d(STAMP_HIT),
                ease: [0.7, 0, 0.2, 1],
                times: [0, 0.55, 0.78, 1],
              },
              rotate: { duration: 0.3, delay: d(STAMP_HIT) },
            }}
          >
            <ReturnStamp label={t("stampLabel")} code={t("stampCode")} />
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-14 max-w-sm text-center md:mt-16"
          animate={
            entered
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: reduce ? 0 : 14 }
          }
          transition={{ duration: 0.7, delay: d(COPY_IN), ease: EASE_OUT }}
        >
          <h1 className="font-heading text-h2 leading-tight text-white">
            {t("title")}
          </h1>
          <p className="mt-4 font-body text-body-p leading-relaxed text-studio-lavande">
            {t("subtitle")}
          </p>

          <div className="mt-9 flex flex-row justify-center gap-3 sm:gap-4">
            <Button variant="studio-outline" size="pill" asChild>
              <Link href="/">{t("homeButton")}</Link>
            </Button>
            <Button variant="studio-jaune" size="pill" asChild>
              <Link href="/studio/start">
                {t("createButton")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

"use client";

import { Link } from "@/navigation";
import { Button } from "@shared/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

// The card and the wording arrive together, then the stamp lands on top.
const CARD_IN = 0.15;
const STAMP_HIT = 0.95;

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * The postal cancel, in the dashboard's own palette. Drawn as SVG so the
 * curved text really follows the ring the way a real cancel does, with a
 * displacement filter giving the ink the uneven bite of a rubber stamp.
 *
 * The landing page carries the same motif on its public 404; the ids here are
 * prefixed so the two never collide if both ever render on one document.
 */
function NotFoundStamp({ label, code }: { label: string; code: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full"
      role="img"
      aria-label={`${label} — ${code}`}
    >
      <defs>
        {/* Full circles: a half-circle path silently drops whatever text
            overflows it, which eats the first and last letters of a long
            label. The bottom arc sweeps the other way so its text reads
            upright along the underside. */}
        <path
          id="dash-stamp-arc-top"
          d="M 32 100 a 68 68 0 1 1 136 0 a 68 68 0 1 1 -136 0"
          fill="none"
        />
        <path
          id="dash-stamp-arc-bottom"
          d="M 42 100 a 58 58 0 1 0 116 0 a 58 58 0 1 0 -116 0"
          fill="none"
        />
        <filter
          id="dash-stamp-ink"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
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
        filter="url(#dash-stamp-ink)"
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
          fontSize="17"
          fontWeight="700"
          letterSpacing="0.5"
        >
          <textPath
            href="#dash-stamp-arc-top"
            startOffset="25%"
            textAnchor="middle"
          >
            {label}
          </textPath>
        </text>

        <text
          fill="#4B3F72"
          stroke="none"
          fontFamily="var(--font-body), sans-serif"
          fontSize="13"
          fontWeight="600"
          letterSpacing="1"
        >
          <textPath
            href="#dash-stamp-arc-bottom"
            startOffset="25%"
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
  const reduce = useReducedMotion() ?? false;

  // The entrance is gated on a mounted flag rather than Framer's `initial`:
  // rendered through `not-found.tsx`, the mount-time initial → animate never
  // fires, and per-element initial states leave the page stranded invisible.
  const [entered, setEntered] = useState(false);
  const [struck, setStruck] = useState(false);
  useEffect(() => {
    setEntered(true);
    const id = setTimeout(() => setStruck(true), reduce ? 0 : STAMP_HIT * 1000);
    return () => clearTimeout(id);
  }, [reduce]);

  const d = (beat: number) => (reduce ? 0 : beat);

  return (
    <div
      // Hidden in the server markup and revealed on mount, so the finished
      // scene never flashes before the entrance plays.
      className={`flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 ${
        entered ? "" : "invisible"
      }`}
    >
      {/* The card sits off-square from the first frame and keeps that angle:
          it drops onto the table, it does not straighten itself out. */}
      <motion.div
        className="relative w-[300px] rounded-[3px] border border-studio-lavande/30 bg-white px-7 pb-20 pt-9 md:w-[390px] md:px-10 md:pb-24 md:pt-12"
        style={{
          boxShadow: "0 24px 48px -24px rgba(75, 63, 114, 0.28)",
          rotate: -2.5,
        }}
        animate={
          entered ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : -24 }
        }
        transition={{ duration: 0.85, delay: d(CARD_IN), ease: EASE_OUT }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[9px] border border-studio-lavande/40"
        />

        <div className="relative pr-1 text-center text-studio-violet/70">
          <p className="font-heading text-xl leading-tight md:text-2xl">
            {t("cardTitle")}
          </p>
          <p className="mt-4 font-body text-[0.7rem] leading-relaxed md:text-xs">
            {t("cardLine")}
          </p>
          <p className="mt-5 font-body text-[0.6rem] tracking-luxe text-studio-violet/45 md:text-[0.65rem]">
            {t("cardFooter")}
          </p>
        </div>

        {/* Struck fully inside the card: violet ink reads on the paper and
            would vanish against anything darker, so none of the ring may
            overhang the edge. */}
        <motion.div
          className="pointer-events-none absolute -bottom-1 -right-1 h-[104px] w-[104px] origin-center md:-bottom-1 md:-right-1 md:h-[128px] md:w-[128px]"
          animate={
            struck
              ? { opacity: 1, scale: 1, rotate: -13 }
              : { opacity: 0, scale: 2.4, rotate: -2 }
          }
          // Tweened, not sprung: a spring interrupted mid-flight by the
          // hydration hand-off settles wherever it happens to be, leaving a
          // half-scaled ghost. The overshoot lives in the easing curve, so the
          // end state is always exactly scale 1.
          transition={
            reduce
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.09 },
                  scale: { duration: 0.34, ease: [0.34, 1.42, 0.64, 1] },
                  rotate: { duration: 0.34, ease: [0.34, 1.42, 0.64, 1] },
                }
          }
        >
          <NotFoundStamp label={t("stampLabel")} code={t("stampCode")} />
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-14 max-w-sm text-center md:mt-16"
        animate={
          entered ? { opacity: 1, y: 0 } : { opacity: 0, y: reduce ? 0 : 14 }
        }
        transition={{ duration: 0.7, delay: d(CARD_IN), ease: EASE_OUT }}
      >
        <h1 className="font-heading text-h3 leading-tight text-studio-violet">
          {t("title")}
        </h1>
        <p className="mt-4 font-body text-sm leading-relaxed text-studio-violet/60">
          {t("description")}
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back_home")}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

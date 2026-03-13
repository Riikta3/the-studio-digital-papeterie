"use client";

import { useImageSequence } from "@/hooks/use-image-sequence";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

const DESKTOP_FRAME_COUNT = 34;
const MOBILE_FRAME_COUNT = 53;

// Module-level stable functions — safe to pass as getFramePath without useCallback
function getDesktopFrame(i: number) {
  return `/videos/desktop/Animation enveloppe personnalisée_${String(i).padStart(3, "0")}.webp`;
}
function getMobileFrame(i: number) {
  return `/videos/mobile/Mobile Test 2_${String(i).padStart(3, "0")}.webp`;
}

export function Hero() {
  const t = useTranslations("Hero");
  // Use ref instead of state to avoid double-initialization of the hook on mobile
  const isMobileRef = useRef(false);
  const frameCountRef = useRef(DESKTOP_FRAME_COUNT);
  const getFramePathRef = useRef(getDesktopFrame);

  useEffect(() => {
    isMobileRef.current = window.innerWidth < 768;
    if (isMobileRef.current) {
      frameCountRef.current = MOBILE_FRAME_COUNT;
      getFramePathRef.current = getMobileFrame;
    }
  }, []);

  const { canvasRef } = useImageSequence({
    frameCount: frameCountRef.current,
    fps: 24,
    getFramePath: getFramePathRef.current,
    loop: true,
  });

  const scrollToThemes = () => {
    document.getElementById("themes")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden pt-20">
      {/* Canvas background — looping image sequence */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: "cover" }}
        aria-hidden="true"
      />

      {/* Overlay vaporeux crème */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 5%, rgba(253,251,247,0.88) 75%)",
        }}
      />

      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.04] mix-blend-multiply bg-noise" />

      <div className="container relative mx-auto flex flex-col items-center justify-center px-4 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="flex max-w-4xl flex-col items-center gap-8"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xs uppercase tracking-[0.3em] text-primary font-medium"
          >
            {t("eyebrow")}
          </motion.p>

          <h1 className="font-heading text-6xl md:text-8xl font-medium tracking-tight text-foreground leading-[0.9] drop-shadow-sm">
            {t("titleLine1")} <br />
            <span className="italic text-primary font-semibold">
              {t("titleLine2")}
            </span>
          </h1>

          <p className="max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed">
            {t("description")}
          </p>

          <div className="mt-6 flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/create"
                className="group relative overflow-hidden rounded-full bg-primary px-10 py-4 text-base font-heading font-semibold italic text-primary-foreground shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {t("createButton")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>

              <button
                onClick={() =>
                  document.getElementById("themes")?.scrollIntoView({ behavior: "smooth" })
                }
                className="rounded-full border border-primary/40 px-8 py-4 text-base font-medium text-primary transition-all hover:bg-primary/5 active:scale-95"
              >
                {t("demoButton")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll anchor — Découvrir les thèmes */}
      <div className="hidden sm:block absolute bottom-12 left-1/2 -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: "reverse" }}
        >
          <button
            onClick={scrollToThemes}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <span className="text-[10px] uppercase tracking-widest font-medium">
              {t("discoverThemes")}
            </span>
            <ChevronDown className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

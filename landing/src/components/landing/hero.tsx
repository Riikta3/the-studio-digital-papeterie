"use client";

import { useImageSequence } from "@/hooks/use-image-sequence";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

const FRAME_COUNT = 82;

function getFrame(i: number) {
  return `/videos/landing/hero/the-studio-digital-papeterie-hero-${String(i).padStart(3, "0")}.webp`;
}

export function Hero() {
  const t = useTranslations("Hero");
  const { canvasRef } = useImageSequence({
    frameCount: FRAME_COUNT,
    fps: 24,
    getFramePath: getFrame,
    loop: true,
  });

  return (
    <section className='relative flex min-h-screen w-full items-center justify-center overflow-hidden pt-20'>
      {/* Canvas background — looping image sequence */}
      <canvas
        ref={canvasRef}
        className='absolute inset-0 w-full h-full'
        style={{ objectFit: "cover" }}
        aria-hidden='true'
      />

      {/* Overlay vaporeux crème */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 5%, rgba(253,251,247,0.88) 75%)",
        }}
      />

      {/* Grain overlay */}
      <div className='fixed inset-0 pointer-events-none z-[100] opacity-[0.04] mix-blend-multiply bg-noise' />

      <div className='container relative mx-auto flex flex-col items-center justify-center px-4 text-center z-10'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className='flex max-w-4xl flex-col items-center gap-8'
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className='text-xs uppercase tracking-[0.3em] text-primary font-medium'
          >
            {t("eyebrow")}
          </motion.p>

          <h1 className='font-heading text-6xl md:text-8xl font-medium tracking-tight text-foreground leading-[0.9] drop-shadow-sm'>
            {t("titleLine1")} <br />
            <span className='italic text-primary font-semibold'>
              {t("titleLine2")}
            </span>
          </h1>

          <p className='max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed'>
            {t("description")}
          </p>

          <div className='mt-6 flex flex-col items-center gap-6'>
            <div className='flex flex-col sm:flex-row items-center gap-4'>
              <Link
                href='/studio/plan'
                className='group relative overflow-hidden rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95'
              >
                <span className='relative z-10 flex items-center gap-3'>
                  {t("createButton")}
                  <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                </span>
              </Link>

              <button
                onClick={() =>
                  document
                    .getElementById("demo-viewer")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className='rounded-full border border-primary/40 px-8 py-4 text-base font-medium text-primary transition-all hover:bg-primary/5 active:scale-95'
              >
                {t("demoButton")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

    </section>
  );
}

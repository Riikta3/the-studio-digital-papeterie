"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function Hero() {
  const t = useTranslations("Hero");
  return (
    <section className='relative flex min-h-screen w-full items-center justify-center overflow-hidden pt-20'>
      {/* Background Decor */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className='absolute inset-0 z-0 pointer-events-none overflow-hidden'
      >
        <Image
          src='/hero-bg.png'
          alt=''
          fill
          priority
          className='object-cover opacity-60' /* Removed mix-blend for cleaner look with new colors */
        />

        {/* Center Overlay to ensure text readability */}
        <div className='absolute inset-0 bg-background/20 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-transparent via-background/40 to-background/90' />
      </motion.div>

      {/* Global Grain Overlay for "Paper Feel" */}
      <div className='fixed inset-0 pointer-events-none z-[100] opacity-[0.04] mix-blend-multiply bg-noise' />

      <div className='container relative mx-auto flex flex-col items-center justify-center px-4 text-center z-10'>
        {/* Text Content Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className='flex max-w-4xl flex-col items-center gap-8'
        >
          <h1 className='font-heading text-6xl md:text-8xl font-medium tracking-tight text-foreground leading-[0.9] drop-shadow-sm'>
            {t("titleLine1")} <br />
            <span className='italic text-primary font-semibold'>
              {t("titleLine2")}
            </span>
          </h1>

          <p className='max-w-lg text-lg md:text-xl font-body text-muted-foreground leading-relaxed'>
            {t("description")}
          </p>

          <div className='mt-10 flex flex-col md:flex-row items-center gap-8'>
            <Link
              href='/create'
              className='group relative overflow-hidden rounded-full bg-primary px-10 py-4 text-xl font-heading font-semibold italic text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:scale-95'
            >
              <span className='relative z-10 flex items-center gap-3 drop-shadow-sm'>
                {t("createButton")}
                <ArrowRight className='h-5 w-5 transition-transform group-hover:translate-x-1' />
              </span>
            </Link>

            <Link
              href='#apercu'
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("apercu")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className='text-xs uppercase tracking-widest font-medium text-muted-foreground/80 hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-0.5'
            >
              {t("demoButton")}
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <div className='absolute bottom-12 left-1/2 -translate-x-1/2'>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 1.5,
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className='cursor-pointer'
        >
          <a
            href='#modeles'
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("modeles")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            className='flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors'
          >
            <span className='text-[10px] uppercase tracking-widest font-medium'>
              {t("discover")}
            </span>
            <ChevronDown className='w-5 h-5' />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

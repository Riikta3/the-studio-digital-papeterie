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
          className='object-cover opacity-40 mix-blend-multiply'
        />

        {/* Center Overlay to ensure text readability */}
        <div className='absolute inset-0 bg-background/20 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-transparent via-background/40 to-background/90' />
      </motion.div>

      <div className='container relative mx-auto flex flex-col items-center justify-center px-4 text-center z-10'>
        {/* Text Content Centered */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className='flex max-w-3xl flex-col items-center gap-6'
        >
          <h1 className='font-heading text-5xl font-bold leading-tight text-foreground md:text-7xl'>
            {t("titleLine1")} <br />
            <span className='text-primary italic'>{t("titleLine2")}</span>
          </h1>

          <p className='max-w-lg text-lg leading-relaxed text-muted-foreground'>
            {t("description")}
          </p>

          <div className='mt-8 flex flex-wrap gap-4 justify-center'>
            <Link
              href='/create/plan'
              className='group flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl'
            >
              {t("createButton")}
              <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
            </Link>
            <Link
              href='#' // Demo link placeholder
              className='rounded-full border border-input bg-white/50 px-8 py-3.5 text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-accent/50'
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
            href='#fonctionnalites'
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("fonctionnalites")?.scrollIntoView({
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

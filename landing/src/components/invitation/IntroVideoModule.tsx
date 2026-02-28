"use client";

import { motion } from "framer-motion";

export interface IntroVideoData {
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
}

const MOCK_INTRO_VIDEO: IntroVideoData = {
  title: "Notre Histoire",
  subtitle: "Un petit mot pour vous",
  description:
    "Avant le grand jour, nous tenions à vous adresser ce message...",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=1", // Typical embed link format
};

export function IntroVideoModule({ weddingId }: { weddingId: string }) {
  const data = MOCK_INTRO_VIDEO;

  if (!data.videoUrl) return null;

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-4xl mx-auto px-4 text-center'
      >
        <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#6C7A6E] mb-4'>
          {data.title}
        </p>
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#333333] mb-4'>
          {data.subtitle}
        </h3>
        <p className='text-[#556B5D] text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light mb-10'>
          {data.description}
        </p>

        <div className='relative w-full aspect-video rounded-[2rem] overflow-hidden border border-[#EBEBEB] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] bg-black'>
          <iframe
            src={data.videoUrl}
            title='Video des mariés'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
            allowFullScreen
            className='absolute inset-0 w-full h-full border-0'
          ></iframe>
        </div>
      </motion.div>
    </section>
  );
}

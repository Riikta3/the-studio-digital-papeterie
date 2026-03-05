"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";

export interface IntroVideoData {
  title: string;
  subtitle: string;
  description: string;
  videoUrl: string;
  videoType?: "embed" | "upload";
}

const MOCK_INTRO_VIDEO: IntroVideoData = {
  title: "Notre Histoire",
  subtitle: "Un petit mot pour vous",
  description:
    "Avant le grand jour, nous tenions à vous adresser ce message...",
  // To test upload mode, change videoType to "upload" and provide an mp4 url.
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  videoType: "embed",
};

export function IntroVideoModule({ weddingId }: { weddingId: string }) {
  const data = MOCK_INTRO_VIDEO;
  const [isPlaying, setIsPlaying] = useState(false);

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
        <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4'>
          {data.title}
        </p>
        <h3 className='font-heading text-5xl md:text-6xl italic text-foreground mb-4'>
          {data.subtitle}
        </h3>
        <p className='text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light mb-12'>
          {data.description}
        </p>

        <div className='relative w-full max-w-3xl mx-auto aspect-video rounded-[2rem] overflow-hidden border border-border shadow-xl bg-secondary group'>
          <AnimatePresence mode='wait'>
            {!isPlaying ? (
              <motion.div
                key='cover'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className='absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-card'
                onClick={() => setIsPlaying(true)}
              >
                {/* Decorative Pattern Background */}
                <div
                  className='absolute inset-0 opacity-[0.2]'
                  style={{
                    backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(108,122,110,0.1) 40%, rgba(108,122,110,0.1) 41%, transparent 41%),
                                    linear-gradient(-45deg, transparent 60%, rgba(108,122,110,0.1) 60%, rgba(108,122,110,0.1) 61%, transparent 61%)`,
                    backgroundSize: "60px 60px",
                    backgroundPosition: "center",
                  }}
                />

                <div className='relative z-10 w-20 h-20 md:w-24 md:h-24 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-110 transition-transform duration-500 ease-out'>
                  <Play
                    className='w-8 h-8 md:w-10 md:h-10 text-primary ml-1 opacity-80'
                    strokeWidth={1}
                  />
                </div>

                <span className='relative z-10 mt-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity duration-300'>
                  Lancer la vidéo
                </span>
              </motion.div>
            ) : (
              <motion.div
                key='video'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className='absolute inset-0 bg-black'
              >
                {data.videoType === "upload" ? (
                  <video
                    src={data.videoUrl}
                    autoPlay
                    controls
                    controlsList='nodownload'
                    className='absolute inset-0 w-full h-full object-cover'
                  />
                ) : (
                  <iframe
                    src={
                      data.videoUrl.includes("?")
                        ? `${data.videoUrl}&autoplay=1`
                        : `${data.videoUrl}?autoplay=1`
                    }
                    title='Video des mariés'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    allowFullScreen
                    className='absolute inset-0 w-full h-full border-0'
                  ></iframe>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}

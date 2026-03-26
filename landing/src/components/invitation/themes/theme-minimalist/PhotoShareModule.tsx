"use client";

import { Button } from "@shared/components/ui/button";
import { motion } from "framer-motion";
import { Camera, ExternalLink } from "lucide-react";

export interface PhotoShareData {
  title: string;
  subtitle: string;
  description: string;
  appUrl: string;
  appUrlLabel: string;
}

const MOCK_PHOTO_SHARE: PhotoShareData = {
  title: "Partage de Photos",
  subtitle: "Capturez l'instant",
  description:
    "Aidez-nous à immortaliser cette journée unique. Téléchargez vos plus belles photos et vidéos sur notre album partagé gratuit en direct !",
  appUrl: "https://wedbox.com",
  appUrlLabel: "Partager mes photos",
};

export function PhotoShareModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const data: PhotoShareData =
    config?.appUrl ? (config as PhotoShareData) : MOCK_PHOTO_SHARE;

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
        <h3 className='font-heading text-5xl md:text-6xl italic text-foreground mb-8'>
          {data.subtitle}
        </h3>

        <div className='bg-card rounded-[2rem] p-10 border border-border shadow-xl max-w-2xl mx-auto flex flex-col items-center'>
          <div className='w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6 text-primary'>
            <Camera className='w-6 h-6 opacity-80' />
          </div>
          <p className='text-muted-foreground text-base leading-relaxed font-light mb-8'>
            {data.description}
          </p>

          <Button
            asChild
            variant='outline'
            className='rounded-full h-auto py-4 px-8 whitespace-normal text-center text-xs font-bold uppercase tracking-[0.2em] border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary hover:border-primary/30 transition-all gap-2 shadow-sm'
          >
            <a
              href={data.appUrl}
              target='_blank'
              rel='noopener noreferrer'
            >
              <span>{data.appUrlLabel}</span>
              <ExternalLink className='w-3.5 h-3.5 opacity-60 flex-shrink-0' />
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

"use client";

import { Button } from "@shared/components/ui/button";
import { motion } from "framer-motion";
import { ExternalLink, Music } from "lucide-react";

export interface PlaylistData {
  title: string;
  subtitle: string;
  description: string;
  playlistUrl: string;
  playlistUrlLabel: string;
}

const MOCK_PLAYLIST: PlaylistData = {
  title: "Musique",
  subtitle: "Playlist Collaborative",
  description:
    "Aidez le DJ à préparer la soirée parfaite ! Ajoutez les musiques qui vous feront danser jusqu'au bout de la nuit sur notre playlist dynamique.",
  playlistUrl: "https://open.spotify.com",
  playlistUrlLabel: "Ajouter un titre",
};

export function PlaylistModule({ weddingId }: { weddingId: string }) {
  const data = MOCK_PLAYLIST;

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
        <h3 className='font-heading text-5xl md:text-6xl italic text-[#333333] mb-8'>
          {data.subtitle}
        </h3>

        <div className='bg-white rounded-[2rem] p-10 border border-[#EBEBEB] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] max-w-2xl mx-auto flex flex-col items-center'>
          <div className='w-16 h-16 bg-[#F5F7F5] rounded-full flex items-center justify-center mb-6 text-[#4B6856]'>
            <Music className='w-6 h-6 opacity-80' />
          </div>
          <p className='text-[#556B5D] text-base leading-relaxed font-light mb-8'>
            {data.description}
          </p>

          <Button
            asChild
            variant='outline'
            className='rounded-full h-auto py-4 px-8 whitespace-normal text-center text-xs font-bold uppercase tracking-[0.2em] border-[#EBEBEB] bg-white text-[#556B5D] hover:bg-[#F9F9F9] hover:text-[#4B6856] hover:border-[#D0D8D3] transition-all gap-2 shadow-sm'
          >
            <a
              href={data.playlistUrl}
              target='_blank'
              rel='noopener noreferrer'
            >
              <span>{data.playlistUrlLabel}</span>
              <ExternalLink className='w-3.5 h-3.5 opacity-60 flex-shrink-0' />
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

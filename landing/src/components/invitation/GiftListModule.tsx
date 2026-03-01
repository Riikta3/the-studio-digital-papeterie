"use client";

import { Button } from "@shared/components/ui/button";
import { motion } from "framer-motion";
import { ExternalLink, Gift } from "lucide-react";

export interface GiftListData {
  title: string;
  subtitle: string;
  description: string;
  url?: string;
  urlLabel?: string;
}

const MOCK_GIFT_LIST: GiftListData = {
  title: "Cadeaux",
  subtitle: "Liste de Mariage",
  description:
    "Votre présence est notre plus beau cadeau. Si vous souhaitez néanmoins participer à notre lune de miel ou notre nouvelle vie, une urne sera à votre disposition le jour J, ou vous pouvez utiliser notre cagnotte en ligne.",
  url: "https://leetchi.com",
  urlLabel: "Contribuer en ligne",
};

export function GiftListModule({ weddingId }: { weddingId: string }) {
  const data = MOCK_GIFT_LIST;

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

        <div className='bg-white rounded-[2rem] p-10 md:p-14 border border-[#EAEAEA] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] max-w-2xl mx-auto flex flex-col items-center'>
          <div className='w-16 h-16 bg-[#F5F7F5] rounded-full flex items-center justify-center mb-6 text-[#4B6856]'>
            <Gift className='w-6 h-6 opacity-80' />
          </div>
          <p className='text-[#556B5D] text-base md:text-lg leading-relaxed font-light mb-8'>
            {data.description}
          </p>

          {data.url && (
            <Button
              asChild
              variant='outline'
              className='rounded-full h-auto py-4 px-8 whitespace-normal text-center text-xs font-bold uppercase tracking-[0.2em] border-[#EBEBEB] bg-white text-[#556B5D] hover:bg-[#F9F9F9] hover:text-[#4B6856] hover:border-[#D0D8D3] transition-all gap-2 shadow-sm'
            >
              <a
                href={data.url}
                target='_blank'
                rel='noopener noreferrer'
              >
                <span>{data.urlLabel || "Contribuer en ligne"}</span>
                <ExternalLink className='w-3.5 h-3.5 opacity-60 flex-shrink-0' />
              </a>
            </Button>
          )}
        </div>
      </motion.div>
    </section>
  );
}

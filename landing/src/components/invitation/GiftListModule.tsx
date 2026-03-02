"use client";

import { motion } from "framer-motion";
import { CreditCard, ExternalLink, Gift, Heart } from "lucide-react";

export interface GiftListProps {
  weddingId: string;
  extras?: {
    gift_list_url?: string;
    gift_list_label?: string;
  };
}

const DEFAULT_GIFT_TEXT = {
  title: "Cadeaux",
  subtitle: "Liste de Mariage",
  description:
    "Votre présence à nos côtés est le plus beau des cadeaux. Si vous souhaitez toutefois nous accompagner dans nos futurs projets ou notre voyage de noces, vous trouverez ci-dessous les options pour participer.",
};

export function GiftListModule({ weddingId, extras }: GiftListProps) {
  const data = DEFAULT_GIFT_TEXT;
  const giftUrl = extras?.gift_list_url || "https://millemercismariage.com"; // Fallback pour la démo
  const giftLabel = extras?.gift_list_label || "Contribuer à notre projet";

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

        <div className='bg-white rounded-[2.5rem] p-8 md:p-16 border border-[#EAEAEA] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] max-w-2xl mx-auto'>
          {/* Header Icon */}
          <div className='w-20 h-20 bg-[#F5F7F5] rounded-full flex items-center justify-center mx-auto mb-8 text-[#4B6856]'>
            <Gift className='w-8 h-8 opacity-90' />
          </div>

          <p className='text-[#556B5D] text-base md:text-lg leading-relaxed font-light mb-12 max-w-md mx-auto'>
            {data.description}
          </p>

          <div className='grid grid-cols-1 gap-6 max-w-md mx-auto'>
            {/* Online Cagnotte Option */}
            <a
              href={giftUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='group relative flex items-center gap-5 p-6 rounded-3xl border border-[#EBEBEB] bg-white transition-all duration-300 hover:border-[#4B6856] hover:shadow-md'
            >
              <div className='w-12 h-12 rounded-2xl bg-[#F5F7F5] flex items-center justify-center text-[#4B6856] group-hover:bg-[#4B6856] group-hover:text-white transition-colors shrink-0'>
                <CreditCard className='w-5 h-5' />
              </div>
              <div className='flex-1 text-left'>
                <h4 className='font-bold text-xs uppercase tracking-widest text-[#333333] mb-1'>
                  Cagnotte en ligne
                </h4>
                <p className='text-xs text-[#6C7A6E] font-light'>{giftLabel}</p>
              </div>
              <ExternalLink className='w-4 h-4 text-[#6C7A6E]/30 group-hover:text-[#4B6856] transition-colors shrink-0' />
            </a>

            {/* Physical Urn Option */}
            <div className='flex items-center gap-5 p-6 rounded-3xl border border-dashed border-[#EBEBEB] bg-[#F9F9F9]/30'>
              <div className='w-12 h-12 rounded-2xl bg-white border border-[#EBEBEB] flex items-center justify-center text-[#6C7A6E] shrink-0'>
                <Heart className='w-5 h-5 opacity-60' />
              </div>
              <div className='flex-1 text-left'>
                <h4 className='font-bold text-xs uppercase tracking-widest text-[#333333] mb-1'>
                  Urne sur place
                </h4>
                <p className='text-xs text-[#6C7A6E] font-light'>
                  Une urne sera disponible le jour J pour vos attentions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

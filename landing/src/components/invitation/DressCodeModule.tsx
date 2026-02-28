"use client";

import { motion } from "framer-motion";
import { Shirt } from "lucide-react";

export interface DressCodeData {
  title: string;
  subtitle: string;
  description: string;
}

const MOCK_DRESS_CODE: DressCodeData = {
  title: "Dress Code",
  subtitle: "Tenue de Soirée",
  description:
    "Pour que la fête soit belle, nous vous invitons à porter une touche de vert sapin ou de doré dans vos tenues. Laissez parler votre créativité !",
};

export function DressCodeModule({ weddingId }: { weddingId: string }) {
  const data = MOCK_DRESS_CODE;

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

        <div className='bg-white rounded-[2rem] p-10 md:p-14 border border-[#EBEBEB] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] max-w-2xl mx-auto flex flex-col items-center'>
          <div className='w-16 h-16 bg-[#F5F7F5] rounded-full flex items-center justify-center mb-6 text-[#4B6856]'>
            <Shirt className='w-6 h-6 opacity-80' />
          </div>
          <p className='text-[#556B5D] text-base md:text-lg leading-relaxed font-light'>
            {data.description}
          </p>
        </div>
      </motion.div>
    </section>
  );
}

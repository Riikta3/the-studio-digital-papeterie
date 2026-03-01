"use client";

import { motion } from "framer-motion";
import { Info } from "lucide-react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqData {
  title: string;
  subtitle: string;
  description: string;
  questions: FaqItem[];
}

const MOCK_FAQ: FaqData = {
  title: "FAQ",
  subtitle: "Infos Pratiques",
  description:
    "Tout ce qu'il faut savoir pour profiter de la journée en toute sérénité.",
  questions: [
    {
      id: "q1",
      question: "La cérémonie se déroulera-t-elle en extérieur ?",
      answer:
        "Le cocktail et le dîner se dérouleront en extérieur dans les jardins du château. Nous vous conseillons de prévoir un petit châle pour la fin de soirée.",
    },
    {
      id: "q2",
      question: "Quelles chaussures privilégier ?",
      answer:
        "Attention aux talons aiguilles ! Une grande partie des festivités aura lieu sur l'herbe et les graviers, privilégiez des talons carrés ou compensés.",
    },
    {
      id: "q3",
      question: "Y aura-t-il des navettes pour le retour ?",
      answer:
        "Oui, un système de navette est organisé vers les hôtels principaux à 2h, 3h et 4h du matin. Pensez à l'indiquer dans le formulaire RSVP !",
    },
  ],
};

export function FaqModule({ weddingId }: { weddingId: string }) {
  const data = MOCK_FAQ;

  if (!data.questions || data.questions.length === 0) return null;

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-4xl mx-auto px-4'
      >
        <div className='text-center mb-16 space-y-4'>
          <p className='text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-[#6C7A6E]'>
            {data.title}
          </p>
          <h3 className='font-heading text-5xl md:text-6xl italic text-[#333333]'>
            {data.subtitle}
          </h3>
          <p className='text-[#556B5D] text-sm md:text-base max-w-2xl mx-auto leading-relaxed font-light'>
            {data.description}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {data.questions.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className='bg-white rounded-[1.5rem] p-8 border border-[#EAEAEA] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.06)] flex flex-col h-full'
            >
              <div className='flex items-start gap-4 mb-4'>
                <Info className='w-5 h-5 text-[#4B6856] mt-1 flex-shrink-0' />
                <h4 className='font-heading text-2xl text-[#333333] leading-tight'>
                  {q.question}
                </h4>
              </div>
              <p className='text-[#556B5D] text-sm leading-relaxed font-light pl-9'>
                {q.answer}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

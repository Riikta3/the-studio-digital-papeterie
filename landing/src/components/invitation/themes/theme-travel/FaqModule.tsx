"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

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

const DEFAULT_FAQ_DATA: FaqData = {
  title: "FAQ",
  subtitle: "Infos Pratiques",
  description:
    "Tout ce qu'il faut savoir pour profiter de la journée en toute sérénité.",
  questions: [
    {
      id: "q1",
      question: "La cérémonie se déroulera-t-elle en extérieur ?",
      answer:
        "Le vin d'honneur et le dîner se dérouleront dans les jardins du Château de Vaux-le-Vicomte. Nous vous conseillons de prévoir un petit châle ou une veste pour la fin de soirée en décembre.",
    },
    {
      id: "q2",
      question: "Quelles chaussures privilégier ?",
      answer:
        "Attention aux talons aiguilles ! Une grande partie des festivités aura lieu sur les allées gravillonnées du château — privilégiez des talons carrés ou compensés.",
    },
    {
      id: "q3",
      question: "Y aura-t-il des navettes depuis Paris ?",
      answer:
        "Oui, des navettes privées partiront depuis le 8e arrondissement de Paris à partir de 14h, et des retours sont prévus à 2h, 3h30 et 5h du matin. Indiquez-le dans votre RSVP !",
    },
    {
      id: "q4",
      question: "Où pouvons-nous nous garer ?",
      answer:
        "Un grand parking gratuit et surveillé est disponible à l'entrée du domaine. Suivez la signalétique à votre arrivée.",
    },
  ],
};

export function FaqModule({
  weddingId,
  config,
}: {
  weddingId: string;
  config?: Record<string, any> | null;
}) {
  const data: FaqData = {
    ...DEFAULT_FAQ_DATA,
    ...config,
    questions: (config?.questions && Array.isArray(config.questions) && config.questions.length > 0)
      ? config.questions as FaqData["questions"]
      : DEFAULT_FAQ_DATA.questions,
  };
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!data.questions || data.questions.length === 0) return null;

  return (
    <section className='w-full'>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className='max-w-3xl mx-auto px-4'
      >
        {/* Title Section */}
        <div className='text-center mb-12'>
          <h2 className='font-heading text-4xl md:text-5xl text-[#0E2F44]'>
            Questions{" "}
            <span className='italic text-[#D35400] opacity-80'>Fréquentes</span>
          </h2>
        </div>

        {/* Accordion List */}
        <div className='space-y-4'>
          {data.questions.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className='bg-[#FDFDFA] rounded-[1.5rem] border border-[#D35400]/20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300'
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className='flex w-full items-center justify-between p-7 text-left transition-colors hover:bg-muted'
              >
                <span className='font-heading text-xl md:text-2xl text-[#0E2F44] pr-8 leading-snug'>
                  {faq.question}
                </span>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                    openIndex === index
                      ? "bg-[#D35400] border-[#D35400] text-white rotate-180"
                      : "border-primary/30 text-[#D35400]",
                  )}
                >
                  {openIndex === index ? (
                    <Minus className='h-4 w-4' />
                  ) : (
                    <Plus className='h-4 w-4 opacity-70' />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className='px-7 pb-8 pt-0'>
                      <div className='h-px w-full bg-[#EAEAEA] mb-6' />
                      <p className='text-[#2E4053]/60 text-base leading-relaxed font-light'>
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

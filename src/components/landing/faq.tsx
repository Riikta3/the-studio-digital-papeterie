"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function FAQ() {
  const t = useTranslations("FAQ");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: t("q1"),
      answer: t("a1"),
    },
    {
      question: t("q2"),
      answer: t("a2"),
    },
    {
      question: t("q3"),
      answer: t("a3"),
    },
    {
      question: t("q4"),
      answer: t("a4"),
    },
    {
      question: t("q5"),
      answer: t("a5"),
    },
  ];

  return (
    <section
      id='faq'
      className='py-24 bg-muted/20'
    >
      <div className='container mx-auto px-4 max-w-3xl'>
        <div className='mb-16 text-center'>
          <h2 className='font-heading text-3xl font-bold md:text-4xl text-foreground'>
            {t("titleLine1")}{" "}
            <span className='text-primary italic'>{t("titleLine2")}</span>
          </h2>
        </div>

        <div className='space-y-4'>
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className='border border-border/50 rounded-2xl bg-card overflow-hidden'
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className='flex w-full items-center justify-between p-6 text-start transition-colors hover:bg-muted/30'
              >
                <span className='font-heading font-semibold text-lg text-foreground'>
                  {faq.question}
                </span>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 transition-all duration-300",
                    openIndex === index
                      ? "bg-primary text-white rotate-180"
                      : "text-primary",
                  )}
                >
                  {openIndex === index ? (
                    <Minus className='h-4 w-4' />
                  ) : (
                    <Plus className='h-4 w-4' />
                  )}
                </div>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className='overflow-hidden'
              >
                <div className='px-6 pb-6 text-muted-foreground leading-relaxed'>
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

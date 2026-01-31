"use client";

import { motion } from "framer-motion";
import { Globe, Leaf, RefreshCcw, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export function Features() {
  const t = useTranslations("Features");

  return (
    <section
      id='fonctionnalites'
      className='relative py-32 overflow-hidden'
    >
      <div className='container mx-auto px-4'>
        {/* Section Header */}
        <div className='mb-24 text-center'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className='font-heading text-4xl md:text-5xl font-medium text-foreground mb-6'
          >
            {t("titleLine1")}{" "}
            <span className='text-primary italic'>{t("titleLine2")}</span>
          </motion.h2>
          <p className='mx-auto mt-4 max-w-2xl text-lg text-muted-foreground font-body'>
            {t("subtitle")}
          </p>
        </div>

        <div className='flex flex-col gap-32'>
          {/* Feature 1: Modifiable - Image Left (Writing), Text Right */}
          <div className='grid md:grid-cols-2 gap-16 items-center'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className='relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border/50 order-2 md:order-1'
            >
              <div
                className='absolute inset-0 bg-cover bg-center transition-transform duration-1000 md:hover:scale-105'
                style={{
                  backgroundImage: "url('/images/landing/feature-writing.png')",
                }}
              />
              <div className='absolute inset-0 bg-black/5' />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className='order-1 md:order-2 space-y-6'
            >
              <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4'>
                <RefreshCcw className='w-6 h-6' />
              </div>
              <h3 className='font-heading text-4xl font-medium text-foreground'>
                {t("editTitle")}
              </h3>
              <p className='text-lg text-muted-foreground leading-relaxed font-body'>
                {t("editDesc")}
              </p>
              <div className='h-1 w-20 bg-primary/20 mt-4' />
            </motion.div>
          </div>

          {/* Feature 2: RSVP & Lang - Text Left, Image Right (Party) */}
          <div className='grid md:grid-cols-2 gap-16 items-center'>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className='space-y-12'
            >
              <div className='space-y-4'>
                <div className='flex items-center gap-3 text-primary font-heading text-2xl'>
                  <Users className='w-6 h-6' />
                  <h3>{t("rsvpTitle")}</h3>
                </div>
                <p className='text-lg text-muted-foreground leading-relaxed pl-9 border-l-2 border-primary/20'>
                  {t("rsvpDesc")}
                </p>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center gap-3 text-primary font-heading text-2xl'>
                  <Globe className='w-6 h-6' />
                  <h3>{t("langTitle")}</h3>
                </div>
                <p className='text-lg text-muted-foreground leading-relaxed pl-9 border-l-2 border-primary/20'>
                  {t("langDesc")}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className='relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border/50'
            >
              <div
                className='absolute inset-0 bg-cover bg-center transition-transform duration-1000 md:hover:scale-105'
                style={{
                  backgroundImage: "url('/images/landing/feature-table.png')",
                }}
              />
              <div className='absolute inset-0 bg-primary/5 mix-blend-overlay' />
            </motion.div>
          </div>

          {/* Feature 3: Eco (Values) - Textured Paper Style */}
          {/* Feature 3: Eco (Values) - Split View (Image Left, Text Right) */}
          <div className='grid md:grid-cols-2 gap-16 items-center'>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className='relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-border/50'
            >
              <div
                className='absolute inset-0 bg-cover bg-center transition-transform duration-1000 md:hover:scale-105'
                style={{
                  backgroundImage: "url('/images/landing/feature-paper.png')",
                }}
              />
              {/* Soft overlay to make the paper feel premium, not just an image */}
              <div className='absolute inset-0 bg-primary/5 mix-blend-multiply' />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className='space-y-6'
            >
              <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4'>
                <Leaf className='w-6 h-6' />
              </div>
              <h3 className='font-heading text-4xl font-medium text-foreground'>
                {t("ecoTitle")}
              </h3>
              <p className='text-lg text-muted-foreground leading-relaxed font-body'>
                {t("ecoDesc")}
              </p>
              <div className='h-1 w-20 bg-primary/20 mt-4' />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Edit3, Eye, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

const FEATURES = [
  { icon: CheckCircle2, key: "feature1" },
  { icon: Users, key: "feature2" },
  { icon: Edit3, key: "feature3" },
  { icon: Eye, key: "feature4" },
] as const;

export function DashboardPreview() {
  const t = useTranslations("Dashboard");

  return (
    <section className='py-24 overflow-hidden bg-secondary/30 relative'>
      <div className='container mx-auto px-4'>
        {/* Header Centré - Comme les autres composants */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className='text-center mb-16'
        >
          <p className='text-xs uppercase tracking-[0.3em] text-primary font-medium mb-3'>
            {t("eyebrow")}
          </p>
          <h2 className='font-heading text-4xl md:text-6xl font-medium text-foreground leading-tight max-w-4xl mx-auto'>
            {t("title")}
          </h2>
          <p className='mt-6 text-muted-foreground/80 max-w-2xl mx-auto leading-relaxed text-lg'>
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Grille de Features Centrée */}
        <div className='flex flex-wrap justify-center gap-6 md:gap-12 mb-16'>
          {FEATURES.map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className='flex items-center gap-3 group'
            >
              <div className='w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors duration-300'>
                <Icon
                  className='w-5 h-5 text-primary'
                  strokeWidth={1.5}
                />
              </div>
              <span className='text-sm font-medium text-foreground/70'>
                {t(key)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Screenshot Preview - Centré et Large */}
        <div className='max-w-5xl mx-auto relative'>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className='relative p-2 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent rounded-[2.5rem] shadow-2xl overflow-hidden'
          >
            <div className='relative rounded-[2rem] overflow-hidden border-4 border-white bg-white shadow-xl'>
              <Image
                src='/images/dashboard-preview.png'
                alt='Dashboard Preview'
                width={1400}
                height={900}
                className='w-full h-auto transform hover:scale-105 transition-transform duration-1000'
                priority
              />
            </div>

            {/* Decorative Floating Element */}
            {/* <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className='absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 md:p-6 rounded-2xl shadow-xl border border-border/40 hidden md:block'
            >
              <div className='flex items-center gap-4'>
                <div className='w-10 h-10 rounded-full bg-green-50 flex items-center justify-center'>
                  <CheckCircle2 className='w-5 h-5 text-green-600' />
                </div>
                <div>
                  <p className='text-[10px] text-muted-foreground uppercase tracking-widest font-bold'>
                    RSVP Validé
                  </p>
                  <p className='text-sm font-heading text-foreground'>
                    Sophie & Marc
                  </p>
                </div>
              </div>
            </motion.div> */}
          </motion.div>

          {/* Background Glow */}
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 blur-[120px] rounded-full -z-10' />
        </div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className='flex justify-center mt-16'
        >
          <Link
            href='/studio/start'
            className='group inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-base font-medium text-primary-foreground shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-95'
          >
            {t("demoButton")}
            <ArrowRight className='w-5 h-5 transition-transform group-hover:translate-x-1' />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

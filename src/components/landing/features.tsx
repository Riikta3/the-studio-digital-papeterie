"use client";

import { motion } from "framer-motion";
import { Globe, Leaf, RefreshCcw, Users } from "lucide-react";
import { useTranslations } from "next-intl";

const features = [
  // ... moved inside component
];

export function Features() {
  const t = useTranslations("Features");

  const features = [
    {
      icon: Leaf,
      title: t("ecoTitle"),
      description: t("ecoDesc"),
      delay: 0.2,
    },
    {
      icon: RefreshCcw,
      title: t("editTitle"),
      description: t("editDesc"),
      delay: 0.3,
    },
    {
      icon: Users,
      title: t("rsvpTitle"),
      description: t("rsvpDesc"),
      delay: 0.4,
    },
    {
      icon: Globe,
      title: t("langTitle"),
      description: t("langDesc"),
      delay: 0.5,
    },
  ];

  return (
    <section
      id='fonctionnalites'
      className='relative py-24 bg-muted/20'
    >
      <div className='container mx-auto px-4'>
        <div className='mb-16 text-center'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className='font-heading text-3xl font-bold text-foreground md:text-4xl'
          >
            {t("titleLine1")}{" "}
            <span className='text-primary italic'>{t("titleLine2")}</span>
          </motion.h2>
          <p className='mx-auto mt-4 max-w-2xl text-muted-foreground'>
            {t("subtitle")}
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: feature.delay }}
              viewport={{ once: true }}
              className='group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm transition-all hover:shadow-md'
            >
              <div className='mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110'>
                <feature.icon className='h-7 w-7' />
              </div>
              <h3 className='mb-3 font-heading text-xl font-semibold text-foreground'>
                {feature.title}
              </h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

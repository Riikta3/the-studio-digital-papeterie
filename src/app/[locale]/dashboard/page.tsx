"use client";

import { useRouter } from "@/navigation";
import { motion } from "framer-motion";
import { Mail, Palette, Settings, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const router = useRouter();

  const cards = [
    {
      title: "Invités",
      count: "124 invités",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      href: "/dashboard/guests",
    },
    {
      title: "Réponses (RSVP)",
      count: "86 confirmés",
      icon: Mail,
      color: "bg-emerald-50 text-emerald-600",
      href: "/dashboard/rsvp",
    },
    {
      title: "Design du site",
      count: "Thème Champêtre",
      icon: Palette,
      color: "bg-amber-50 text-amber-600",
      href: "/dashboard/design",
    },
    {
      title: "Mon Compte",
      count: "Paramètres",
      icon: Settings,
      color: "bg-slate-50 text-slate-600",
      href: "/dashboard/settings",
    },
  ];

  return (
    <div className='container mx-auto px-6 py-12'>
      {/* Welcome Header */}
      <div className='mb-12'>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className='font-heading text-4xl md:text-5xl text-primary italic mb-2'
        >
          Bonjour Sarah
        </motion.h1>
        <p className='text-muted-foreground text-lg'>
          Bienvenue sur votre carnet de mariage numérique.
        </p>
      </div>

      {/* Dashboard Grid */}
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => router.push(card.href)}
            className='bg-white p-6 rounded-2xl border border-border/40 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group'
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.color} group-hover:scale-110 transition-transform`}
            >
              <card.icon className='w-6 h-6' />
            </div>
            <h3 className='font-heading text-xl font-semibold text-foreground mb-1'>
              {card.title}
            </h3>
            <p className='text-sm text-muted-foreground'>{card.count}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { Calendar, LogOut, Mail, Palette, Settings, Users } from "lucide-react";
import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");

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
    <div className='min-h-screen bg-[#FDFBF7]'>
      {/* Top Navigation */}
      <nav className='border-b border-border/40 bg-white/50 backdrop-blur-sm sticky top-0 z-50'>
        <div className='container mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Link
              href='/'
              className='font-heading text-xl font-bold tracking-tight'
            >
              The Studio.
            </Link>
            <span className='text-muted-foreground/30'>|</span>
            <span className='text-sm font-medium text-muted-foreground'>
              Espace Mariés
            </span>
          </div>
          <div className='flex items-center gap-4'>
            <div className='hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full text-xs font-medium text-primary'>
              <Calendar className='w-3 h-3' />
              j-145
            </div>
            <button className='p-2 hover:bg-black/5 rounded-full transition-colors text-muted-foreground'>
              <LogOut className='w-4 h-4' />
            </button>
          </div>
        </div>
      </nav>

      <main className='container mx-auto px-6 py-12'>
        {/* Welcome Header */}
        <div className='mb-12'>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='font-heading text-4xl md:text-5xl text-primary italic mb-2'
          >
            Bonjour Charlotte & William
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
      </main>
    </div>
  );
}

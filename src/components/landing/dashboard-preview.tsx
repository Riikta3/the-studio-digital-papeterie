"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquareHeart,
  MousePointerClick,
  Palette,
  Settings,
  Users,
} from "lucide-react";

export function DashboardPreview() {
  return (
    <section
      id='apercu'
      className='py-24 bg-gradient-to-b from-muted/30 to-background overflow-hidden'
    >
      <div className='container mx-auto px-4'>
        <div className='mb-16 text-center max-w-3xl mx-auto'>
          <h2 className='font-heading text-3xl font-bold md:text-4xl mb-6'>
            Tout gérer depuis un <br />
            <span className='text-primary italic'>Tableau de Bord unique</span>
          </h2>
          <p className='text-muted-foreground text-lg'>
            Gérez votre liste d'invités, suivez les réponses en temps réel et
            personnalisez votre site sans écrire une seule ligne de code.
          </p>
        </div>

        {/* Dashboard UI Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className='relative max-w-6xl mx-auto'
        >
          {/* The Dashboard Card */}
          <div className='rounded-2xl border border-border bg-card shadow-2xl overflow-hidden min-h-[400px] md:aspect-[21/9] flex flex-col md:flex-row'>
            {/* Sidebar */}
            <div className='w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/30 flex md:flex-col p-4 gap-4 md:gap-0 overflow-x-auto md:overflow-x-visible'>
              <div className='h-8 w-8 md:w-32 bg-primary/20 rounded-md mb-0 md:mb-8 shrink-0' />{" "}
              {/* Logo placeholder */}
              {/* Logo placeholder */}
              <ul className='flex md:flex-col space-x-2 md:space-x-0 md:space-y-2'>
                {[
                  {
                    icon: LayoutDashboard,
                    label: "Vue d'ensemble",
                    active: true,
                  },
                  { icon: Users, label: "Invités (RSVP)", active: false },
                  { icon: Palette, label: "Design & Thème", active: false },
                  {
                    icon: MessageSquareHeart,
                    label: "Livre d'or",
                    active: false,
                  },
                  { icon: Settings, label: "Paramètres", active: false },
                ].map((item, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors shrink-0",
                      item.active
                        ? "bg-card shadow-sm text-primary"
                        : "text-muted-foreground hover:bg-card/50",
                    )}
                  >
                    <item.icon className='w-5 h-5 shrink-0' />
                    <span className='hidden md:inline'>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main Content Area */}
            <div className='flex-1 p-6 md:p-8 bg-background/50 overflow-hidden relative'>
              {/* Header */}
              <div className='flex justify-between items-center mb-8'>
                <div>
                  <div className='font-heading text-2xl font-bold text-foreground'>
                    Bonjour, Paula
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Voici ce qu'il se passe aujourd'hui.
                  </p>
                </div>
                <div className='flex gap-4'>
                  <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold'>
                    P
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
                {[
                  {
                    label: "Invités Confirmés",
                    value: "84",
                    sub: "sur 120 invités",
                    color: "bg-blue-50 text-blue-600",
                  },
                  {
                    label: "En attente",
                    value: "36",
                    sub: "Relance prévue J-30",
                    color: "bg-amber-50 text-amber-600",
                  },
                  {
                    label: "Régimes spéciaux",
                    value: "12",
                    sub: "dont 4 végétariens",
                    color: "bg-green-50 text-green-600",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className='bg-card p-6 rounded-xl border border-border shadow-sm'
                  >
                    <div className='text-sm text-muted-foreground mb-2'>
                      {stat.label}
                    </div>
                    <div className='text-3xl font-bold mb-1'>{stat.value}</div>
                    <div
                      className={cn(
                        "text-xs inline-flex px-2 py-0.5 rounded-full font-medium",
                        stat.color,
                      )}
                    >
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Activity List placeholder */}
              <div className='bg-card rounded-xl border border-border shadow-sm p-6'>
                <div className='font-semibold mb-4'>Dernières réponses</div>
                <div className='space-y-4'>
                  {[1, 2, 3].map((_, i) => (
                    <div
                      key={i}
                      className='flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-muted' />
                        <div>
                          <div className='h-3 w-24 bg-muted-foreground/20 rounded mb-1' />
                          <div className='h-2 w-16 bg-muted-foreground/10 rounded' />
                        </div>
                      </div>
                      <div className='h-6 w-16 bg-green-100 rounded-full' />
                    </div>
                  ))}
                </div>
              </div>

              {/* Cursor Graphic Overlay */}
              <motion.div
                initial={{ x: 200, y: 200, opacity: 0 }}
                animate={{ x: 50, y: 50, opacity: 1 }}
                transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                className='absolute bottom-10 right-10 z-20 hidden md:block'
              >
                <MousePointerClick className='w-12 h-12 text-primary drop-shadow-lg fill-primary/20' />
                <div className='bg-primary text-white text-xs px-3 py-1.5 rounded-lg shadow-lg absolute top-8 left-6 whitespace-nowrap'>
                  Gestion ultra-simple
                </div>
              </motion.div>
            </div>
          </div>

          {/* Decorative blurs behind */}
          <div className='absolute -top-10 -right-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl z-[-1]' />
          <div className='absolute -bottom-10 -left-10 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl z-[-1]' />
        </motion.div>
      </div>
    </section>
  );
}

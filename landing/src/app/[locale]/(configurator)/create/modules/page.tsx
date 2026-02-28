"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bus,
  CalendarDays,
  Check,
  Gift,
  Hotel,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Timer,
  Utensils,
} from "lucide-react";

const MODULES = [
  {
    id: "countdown",
    label: "Compte à Rebours",
    icon: Timer,
    desc: "Le décompte avant le jour J",
  },
  {
    id: "timeline",
    label: "Programme du Jour",
    icon: CalendarDays,
    desc: "Horaires et lieux des cérémonies",
  },
  {
    id: "rsvp",
    label: "Gestion RSVP",
    icon: Check,
    desc: "Formulaire de réponse en ligne",
  },
  {
    id: "gallery",
    label: "Galerie Photo",
    icon: ImageIcon,
    desc: "Partagez vos meilleurs souvenirs",
  },
  {
    id: "map",
    label: "Plan & Accès",
    icon: MapPin,
    desc: "Intégration Google Maps / Waze",
  },
  {
    id: "gift-list",
    label: "Liste de Mariage",
    icon: Gift,
    desc: "Lien vers votre cagnotte ou liste",
  },
  {
    id: "guestbook",
    label: "Livre d'Or",
    icon: MessageSquare,
    desc: "Vos invités laissent un petit mot",
  },
  {
    id: "accommodation",
    label: "Hébergements",
    icon: Hotel,
    desc: "Suggestions d'hôtels à proximité",
  },
  {
    id: "transport",
    label: "Navettes & Transport",
    icon: Bus,
    desc: "Infos logistiques pour les invités",
  },
  {
    id: "menu",
    label: "Menu & Régimes",
    icon: Utensils,
    desc: "Détail du repas et allergies",
  },
  {
    id: "video-guestbook",
    label: "Livre d'Or Vidéo",
    icon: MessageSquare,
    desc: "Vos invités laissent un message vidéo.",
  },
];

export default function ModulesPage() {
  const { modules, toggleModule, plan } = useOrderStore();

  const isIncluded = (index: number) => {
    if (plan === "premium") return true;
    // In Experience plan, first 4 selected are included.
    // However, the logic here is tricky because selections are unordered in the store usually.
    // We will just simplify display: Count how many are selected.
    // If selected count <= 4, all selected are "included".
    // If selected count > 4, the "last" ones added pay.
    // BUT visually, we just want to show the user "4 included".
    return true;
  };

  const selectedCount = modules.length;
  const extraCount = plan === "experience" ? Math.max(0, selectedCount - 4) : 0;

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-center space-y-4'>
        <h1 className='font-heading text-4xl font-bold md:text-5xl'>
          Vos <span className='italic text-primary'>Modules</span>
        </h1>
        <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
          {plan === "premium"
            ? "Tout est inclus dans votre offre Premium. Faites-vous plaisir !"
            : `4 modules sont inclus dans votre offre. Au-delà, +5€ par module.`}
        </p>

        {/* Counter Badge */}
        <div className='inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-border'>
          <span
            className={cn(
              "font-bold",
              extraCount > 0 ? "text-primary" : "text-foreground",
            )}
          >
            {selectedCount}
          </span>
          <span className='text-muted-foreground text-sm'>sélectionnés</span>
          {extraCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className='ml-2 text-xs font-bold text-white bg-primary px-2 py-0.5 rounded-full'
            >
              +{extraCount * 5}€
            </motion.span>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4'>
        {MODULES.map((module) => {
          const isSelected = modules.includes(module.id);
          const Icon = module.icon;

          return (
            <div
              key={module.id}
              onClick={() => toggleModule(module.id)}
              className={cn(
                "group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 select-none",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/30 hover:bg-muted/30",
              )}
            >
              <div className='flex items-start gap-4'>
                <div
                  className={cn(
                    "p-3 rounded-xl transition-colors",
                    isSelected
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground group-hover:text-primary",
                  )}
                >
                  <Icon className='w-6 h-6' />
                </div>

                <div className='flex-1'>
                  <div className='flex justify-between items-center mb-1'>
                    <h3
                      className={cn(
                        "font-heading font-semibold",
                        isSelected && "text-primary",
                      )}
                    >
                      {module.label}
                    </h3>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className='text-primary'
                      >
                        <Check className='w-4 h-4' />
                      </motion.div>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground leading-relaxed'>
                    {module.desc}
                  </p>
                </div>
              </div>

              {/* +5€ Animation Bubble when selecting 5th+ module in Experience plan */}
              <AnimatePresence>
                {isSelected &&
                  plan === "experience" &&
                  selectedCount > 4 &&
                  // Simple visual trick: If this is selected and we are over limit,
                  // we don't know exactly WHICH one caused the overage without time tracking,
                  // but generally showing it's a paid slot is good.
                  // For this MVP, let's keep it simple.
                  null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

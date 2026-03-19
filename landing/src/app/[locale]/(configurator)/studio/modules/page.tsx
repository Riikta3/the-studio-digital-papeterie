"use client";

import { cn } from "@/lib/utils";
import { StepTransition } from "@/components/configurator/StepTransition";
import { useOrderStore } from "@/stores/use-order-store";
import {
  Bus,
  CalendarDays,
  Check,
  Gift,
  Hotel,
  Image as ImageIcon,
  Info,
  MapPin,
  MessageSquare,
  Music,
  PlayCircle,
  Shirt,
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
    id: "intro-video",
    label: "Vidéo d'Intro",
    icon: PlayCircle,
    desc: "Un message vidéo des mariés",
  },
  {
    id: "timeline",
    label: "Programme du Jour",
    icon: CalendarDays,
    desc: "Horaires et lieux des cérémonies",
  },
  {
    id: "dress-code",
    label: "Dress Code",
    icon: Shirt,
    desc: "Recommandations vestimentaires",
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
    id: "playlist",
    label: "Musique",
    icon: Music,
    desc: "Playlist collaborative pour DJ",
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
  {
    id: "faq",
    label: "FAQ / Pratique",
    icon: Info,
    desc: "Infos pratiques pour assister les invités",
  },
];

export default function ModulesPage() {
  const { modules, toggleModule, plan } = useOrderStore();

  const extraCount = plan === "experience" ? Math.max(0, modules.length - 4) : 0;
  const extraCost = extraCount * 5;

  return (
    <StepTransition>
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Vos <span className="italic text-primary">fonctionnalités</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          {plan === "premium"
            ? "Tous les modules sont inclus dans votre offre."
            : "4 modules inclus. +5€ par module supplémentaire."}
        </p>
      </div>

      {/* Counter badge */}
      {plan === "experience" && modules.length > 0 && (
        <div className="flex justify-center">
          <span className="font-sans text-xs font-bold px-4 py-1.5 rounded-full bg-primary/10 text-primary">
            {modules.length} sélectionné{modules.length > 1 ? "s" : ""}
            {extraCost > 0 ? ` · +${extraCost}€` : " · inclus"}
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2 max-w-lg mx-auto w-full px-4">
        {MODULES.map((mod) => {
          const isSelected = modules.includes(mod.id);
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => toggleModule(mod.id)}
              className={cn(
                "w-full text-left flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                  isSelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">{mod.label}</p>
                <p className="text-xs text-muted-foreground font-sans mt-0.5 line-clamp-1">{mod.desc}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                  isSelected ? "border-primary/40 bg-primary/15" : "border-border",
                )}
              >
                {isSelected && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
    </StepTransition>
  );
}

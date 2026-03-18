"use client";

import { cn } from "@/lib/utils";
import { useOrderStore, type PlanType } from "@/stores/use-order-store";

type PlanConfig = {
  id: PlanType;
  name: string;
  price: number;
  badge?: string;
  tagline: string;
  features: string[];
  accentColor: string;
};

const PLANS: PlanConfig[] = [
  {
    id: "experience",
    name: "Essentiel",
    price: 175,
    tagline: "Tout ce qu'il faut pour une invitation parfaite.",
    features: [
      "Site d'invitation personnalisé",
      "4 modules inclus",
      "1 langue incluse",
      "Animation d'entrée",
      "RSVP en ligne",
      "Accès à vie",
    ],
    accentColor: "#7c2d3e",
  },
  {
    id: "premium",
    name: "Premium",
    price: 575,
    badge: "Le plus complet",
    tagline: "L'expérience ultime, sans limite.",
    features: [
      "Tout du pack Essentiel",
      "Modules illimités",
      "Toutes les langues incluses",
      "Illustration sur mesure",
      "Musique personnalisée",
      "Domaine personnalisé inclus",
      "Support prioritaire",
    ],
    accentColor: "#7c2d3e",
  },
];

export default function PlanPage() {
  const { plan, setPlan } = useOrderStore();

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Choisissez votre{" "}
          <span className="italic text-primary">offre</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Un paiement unique. Accès à vie garanti.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-lg mx-auto w-full px-4">
        {PLANS.map((p) => {
          const isSelected = plan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className={cn(
                "w-full text-left rounded-2xl border-2 p-5 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading text-lg font-bold">{p.name}</span>
                    {p.badge && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-sans">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs font-sans mb-3">{p.tagline}</p>
                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs font-sans text-foreground/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="font-heading text-2xl font-bold text-primary">{p.price}€</span>
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? "border-primary bg-primary" : "border-border",
                    )}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";
import { useConfiguratorStep } from "@/hooks/use-configurator-step";

export default function PlanPage() {
  const { plan, setPlan } = useOrderStore();
  const { goToNextStep } = useConfiguratorStep();

  const premiumSelected = plan === "premium";
  const essentialSelected = plan === "experience";

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center space-y-2 px-4 pb-2">
        <h1 className="font-heading text-3xl font-bold md:text-4xl lg:text-5xl">
          Choisissez votre{" "}
          <span className="italic text-primary">offre</span>
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto font-sans">
          Un paiement unique. Accès à vie garanti.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-lg mx-auto w-full px-4">

        {/* Premium — hero card */}
        <div
          className={cn(
            "rounded-2xl border-2 p-5 transition-all duration-200 relative",
            premiumSelected
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border bg-card",
          )}
        >
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary text-primary-foreground font-sans whitespace-nowrap">
              ⭐ Recommandé
            </span>
          </div>

          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-1">Premium</p>
              <span className="font-heading text-3xl font-bold text-primary">575€</span>
            </div>
            <ul className="text-xs font-sans text-foreground/70 space-y-1 text-right">
              <li>Modules illimités</li>
              <li>Domaine offert</li>
              <li>Support 7j/7</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground font-sans mb-4">
            La sérénité totale. Aucune limite.
          </p>

          <button
            onClick={() => { setPlan("premium"); goToNextStep(); }}
            className={cn(
              "w-full py-3 rounded-full text-sm font-bold font-sans transition-colors",
              premiumSelected
                ? "bg-primary/80 text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {premiumSelected ? "✓ Sélectionné" : "Choisir Premium"}
          </button>
        </div>

        {/* Essentiel — compact row */}
        <div
          className={cn(
            "rounded-2xl border-2 px-5 py-4 transition-all duration-200 flex items-center gap-4",
            essentialSelected
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card",
          )}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-0.5">Expérience</p>
            <span className="font-heading text-xl font-bold text-primary">175€</span>
            <div className="flex gap-3 mt-1">
              <span className="text-[10px] text-muted-foreground font-sans">4 modules</span>
              <span className="text-[10px] text-muted-foreground font-sans">+5€/extra</span>
            </div>
          </div>

          <button
            onClick={() => { setPlan("experience"); goToNextStep(); }}
            className={cn(
              "flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold font-sans border-2 transition-colors",
              essentialSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary text-primary bg-transparent hover:bg-primary/5",
            )}
          >
            {essentialSelected ? "✓ Choisi" : "Choisir"}
          </button>
        </div>

      </div>
    </div>
  );
}

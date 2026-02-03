"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "@/navigation";
import { useOrderStore, type PlanType } from "@/stores/use-order-store";
import { Check, Sparkles, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PlanPage() {
  const { plan, setPlan } = useOrderStore();
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const selected = searchParams.get("selected");
    if (selected === "experience" || selected === "premium") {
      setPlan(selected as PlanType);
    }
  }, [searchParams, setPlan]);

  const handleSelect = (p: PlanType) => {
    setPlan(p);
    router.push("/create/theme"); // Auto-advance
  };

  return (
    <div className='flex flex-col gap-8'>
      <div className='text-center space-y-4'>
        <h1 className='font-heading text-4xl font-bold md:text-5xl'>
          Choisissez votre{" "}
          <span className='italic text-primary'>Expérience</span>
        </h1>
        <p className='text-muted-foreground text-lg max-w-xl mx-auto'>
          Démarrez avec l'essentiel ou offrez-vous la totale liberté sans
          contrainte.
        </p>
      </div>

      <div className='grid md:grid-cols-2 gap-6 mt-4'>
        {/* EXPERIENCE PLAN */}
        <div
          onClick={() => handleSelect("experience")}
          className={cn(
            "relative group cursor-pointer rounded-3xl border-2 p-8 transition-all duration-300 hover:shadow-2xl",
            plan === "experience"
              ? "border-primary bg-primary/5 shadow-xl scale-[1.02]"
              : "border-border bg-card hover:border-primary/50",
          )}
        >
          {plan === "experience" && (
            <div className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-1'>
              <Check className='w-3 h-3' /> Sélectionné
            </div>
          )}

          <div className='flex justify-between items-start mb-6'>
            <div className='p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors'>
              <Sparkles className='w-6 h-6 text-primary' />
            </div>
            <span className='font-heading text-3xl font-bold'>175€</span>
          </div>

          <h3 className='font-heading text-2xl font-bold mb-2'>Expérience</h3>
          <p className='text-muted-foreground mb-6 text-sm leading-relaxed'>
            Parfait pour les mariages intimes. L'essentiel pour communiquer avec
            élégance.
          </p>

          <ul className='space-y-3'>
            <li className='flex items-center gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-primary' />
              <span>4 modules inclus au choix</span>
            </li>
            <li className='flex items-center gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-primary' />
              <span>Design responsive mobile</span>
            </li>
            <li className='flex items-center gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-primary' />
              <span>Support par email</span>
            </li>
            <li className='flex items-center gap-3 text-sm text-muted-foreground'>
              <div className='w-1.5 h-1.5 rounded-full bg-muted-foreground/30' />
              <span>+5€ par module supplémentaire</span>
            </li>
          </ul>

          <div
            className={cn(
              "w-full mt-8 rounded-full py-3 text-sm font-semibold transition-all text-center",
              plan === "experience"
                ? "bg-[#455e4e] text-white shadow-md"
                : "bg-card border border-[#455e4e] text-[#455e4e] group-hover:bg-[#455e4e] group-hover:text-white",
            )}
          >
            {plan === "experience" ? "Sélectionné" : "Choisir"}
          </div>
        </div>

        {/* PREMIUM PLAN */}
        <div
          onClick={() => handleSelect("premium")}
          className={cn(
            "relative group cursor-pointer rounded-3xl border-2 p-8 transition-all duration-300 hover:shadow-2xl",
            plan === "premium"
              ? "border-primary bg-primary/5 shadow-xl scale-[1.02]"
              : "border-border bg-card hover:border-primary/50",
          )}
        >
          {plan === "premium" && (
            <div className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg flex items-center gap-1'>
              <Check className='w-3 h-3' /> Sélectionné
            </div>
          )}
          {/* Badge Best Seller */}
          <div className='absolute -top-3 -right-3 md:-right-4 bg-foreground text-background px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg rotate-3 group-hover:rotate-6 transition-transform'>
            Best Seller
          </div>

          <div className='flex justify-between items-start mb-6'>
            <div className='p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors'>
              <Star className='w-6 h-6 text-primary' />
            </div>
            <span className='font-heading text-3xl font-bold'>575€</span>
          </div>

          <h3 className='font-heading text-2xl font-bold mb-2'>Premium</h3>
          <p className='text-muted-foreground mb-6 text-sm leading-relaxed'>
            La sérénité absolue. Aucune limite pour le plus beau jour de votre
            vie.
          </p>

          <ul className='space-y-3'>
            <li className='flex items-center gap-3 text-sm font-medium'>
              <div className='w-1.5 h-1.5 rounded-full bg-primary' />
              <span>Tous les modules ILLIMITÉS</span>
            </li>
            <li className='flex items-center gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-primary' />
              <span>Nom de domaine offert (.com/.fr)</span>
            </li>
            <li className='flex items-center gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-primary' />
              <span>Support prioritaire 7j/7</span>
            </li>
            <li className='flex items-center gap-3 text-sm'>
              <div className='w-1.5 h-1.5 rounded-full bg-primary' />
              <span>Suppression du logo "Studio"</span>
            </li>
          </ul>

          <div
            className={cn(
              "w-full mt-8 rounded-full py-3 text-sm font-semibold transition-all text-center",
              plan === "premium"
                ? "bg-[#455e4e] text-white shadow-md"
                : "bg-card border border-[#455e4e] text-[#455e4e] group-hover:bg-[#455e4e] group-hover:text-white",
            )}
          >
            {plan === "premium" ? "Sélectionné" : "Choisir"}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useConfiguratorStep } from "@/hooks/use-configurator-step";
import { cn } from "@/lib/utils";
import { StepTransition } from "@/components/configurator/StepTransition";
import { useOrderStore } from "@/stores/use-order-store";

export default function PlanPage() {
  const { plan, setPlan } = useOrderStore();
  const { goToNextStep } = useConfiguratorStep();

  const premiumSelected = plan === "premium";
  const essentialSelected = plan === "experience";

  return (
    <StepTransition>
    <div className='flex flex-col gap-4'>
      <div className='text-center space-y-2 px-4 pb-2'>
        <h1 className='font-heading text-3xl font-bold md:text-4xl lg:text-5xl'>
          Créez une expérience mémorable{" "}
          <span className='italic text-primary'>pour vos invités</span>
        </h1>
        <p className='text-muted-foreground text-sm max-w-sm mx-auto font-sans'>
          Choisissez la formule qui donnera vie à votre évènement.
        </p>
      </div>

      <div className='flex flex-col gap-3 max-w-lg mx-auto w-full px-4'>
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
          <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
            <span className='text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-primary text-primary-foreground font-sans whitespace-nowrap'>
              ⭐ Recommandé
            </span>
          </div>

          <div className='flex items-start justify-between gap-4 mb-3'>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-1'>
                L’expérience Premium
              </p>
              <span className='font-heading text-3xl font-bold text-primary'>
                575€
              </span>
            </div>
            <ul className='text-xs font-sans text-foreground/70 space-y-1 text-right'>
              <li>Modules illimités</li>
              <li>Domaine offert</li>
              <li>Support 7j/7</li>
            </ul>
          </div>

          <p className='text-xs text-muted-foreground font-sans mb-1'>
            – Modules illimités : Galeries photos, RSVP, plans d’accès,
            hebergement... Creez sans limites.
          </p>
          <p className='text-xs text-muted-foreground font-sans mb-1'>
            – Nom de domaine personnalisé inclus : Une adresse élégante pour vos
            invités
          </p>
          <p className='text-xs text-muted-foreground font-sans mb-4'>
            – Support prioritaire : Une question ? Notre équipe s’engage à vous
            répondre en moins de 24H.
          </p>

          <button
            onClick={() =>
              premiumSelected ? goToNextStep() : setPlan("premium")
            }
            className={cn(
              "w-full py-3 rounded-full text-sm font-bold font-sans border-2 transition-colors",
              premiumSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary bg-transparent text-primary hover:bg-primary/5",
            )}
          >
            {premiumSelected ? "✓ Commencer la création" : "Choisir"}
          </button>
        </div>

        {/* Essentiel */}
        <div
          className={cn(
            "rounded-2xl border-2 px-5 py-4 transition-all duration-200",
            essentialSelected
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card",
          )}
        >
          <div className='gap-4 mb-3'>
            <p className='text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans mb-0.5'>
              L'essentiel
            </p>
            <span className='font-heading text-3xl font-bold text-primary'>
              175€
            </span>
            <p className='text-xs text-muted-foreground italic font-sans mt-1'>
              Les fondamentaux pour une annonce élégante
            </p>
          </div>

          <ul className='text-xs text-muted-foreground font-sans space-y-1.5 mb-4'>
            <li>
              – 4 modules au choix : L'indispensable pour informer vos proches
            </li>
            <li>– Interface 100% mobile responsive</li>
            <li>
              – Extras à la carte : Ajoutez des fonctionnalités selon vos
              besoins (+5€/module)
            </li>
            <li>– Support standard : Réponse sous 48h</li>
          </ul>

          <button
            onClick={() =>
              essentialSelected ? goToNextStep() : setPlan("experience")
            }
            className={cn(
              "w-full py-2.5 rounded-full text-sm font-bold font-sans border-2 transition-colors",
              essentialSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary text-primary bg-transparent hover:bg-primary/5",
            )}
          >
            {essentialSelected ? "✓ Commencer la création" : "Choisir"}
          </button>
        </div>
      </div>
    </div>
    </StepTransition>
  );
}

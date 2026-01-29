"use client";

import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { useOrderStore } from "@/stores/use-order-store";

const plans = [
  {
    id: "experience",
    title: "Experience",
    price: "175 EUR",
    details: [
      "4 blocs inclus",
      "Background photo",
      "Dashboard RSVP",
      "Animation enveloppe",
    ],
  },
  {
    id: "premium",
    title: "Premium",
    price: "575 EUR",
    details: [
      "Blocs illimites",
      "Design 100% custom",
      "Toutes options incluses",
      "Accompagnement VIP",
    ],
  },
] as const;

export default function PlanPage() {
  const router = useRouter();
  const selectedPlan = useOrderStore((state) => state.plan);
  const setPlan = useOrderStore((state) => state.setPlan);

  const handleSelect = (planId: (typeof plans)[number]["id"]) => {
    setPlan(planId);
    router.push("/create/theme");
  };

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-supertitle text-muted-foreground">
          Etape 1
        </p>
        <h1 className="text-3xl font-heading md:text-4xl">
          Choisissez votre plan
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground md:text-base">
          Commencez par l'offre qui correspond au niveau de personnalisation
          souhaite.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => handleSelect(plan.id)}
            className={cn(
              "glass-card group flex h-full w-full flex-col justify-between rounded-lg p-6 text-left transition",
              "hover:-translate-y-1 hover:shadow-2xl",
              selectedPlan === plan.id && "ring-2 ring-primary"
            )}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-supertitle text-muted-foreground">
                  Plan
                </p>
                <h2 className="text-2xl font-heading">{plan.title}</h2>
              </div>
              <p className="text-3xl font-semibold text-primary">
                {plan.price}
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.details.map((detail) => (
                  <li key={detail}>- {detail}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Selectionner</span>
              <span className="text-primary">-&gt;</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

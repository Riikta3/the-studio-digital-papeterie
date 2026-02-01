"use client";

import { cn } from "@/lib/utils";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Expérience",
    price: "175€",
    description: "L'essentiel pour une invitation élégante.",
    features: [
      "Site web responsive",
      "4 blocs d'informations inclus",
      "Dashboard RSVP complet",
      "Animation enveloppe standard",
      "Support email",
    ],
    highlight: false,
    cta: "Choisir Expérience",
  },
  {
    name: "Premium",
    price: "575€",
    description: "L'expérience ultime sans compromis.",
    features: [
      "Tout inclus (Blocs illimités)",
      "Design 100% Customisable",
      "Animation enveloppe sur-mesure",
      "Nom de domaine offert",
      "Support prioritaire 7j/7",
      "Vidéo d'invitation (Option)",
    ],
    highlight: true,
    cta: "Choisir Premium",
  },
];

export function PricingPreview() {
  return (
    <section
      id='tarifs'
      className='py-24'
    >
      <div className='container mx-auto px-4'>
        <div className='mb-16 text-center'>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className='font-heading text-3xl font-bold md:text-4xl'
          >
            Une tarification{" "}
            <span className='text-primary italic'>transparente</span>
          </motion.h2>
          <p className='mt-4 text-muted-foreground'>
            Paiement unique. Aucun frais caché. Accès à vie.
          </p>
        </div>

        <div className='mx-auto grid max-w-5xl gap-8 md:grid-cols-2'>
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "relative flex flex-col rounded-3xl border p-8 transition-all hover:shadow-xl",
                plan.highlight
                  ? "bg-card border-primary/20 shadow-lg ring-1 ring-primary/20"
                  : "bg-card border-border/50 shadow-sm",
              )}
            >
              {plan.highlight && (
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground'>
                  Le plus populaire
                </div>
              )}

              <div className='mb-8'>
                <h3 className='font-heading text-2xl font-bold'>{plan.name}</h3>
                <div className='mt-4 flex items-baseline gap-1'>
                  <span className='text-4xl font-bold'>{plan.price}</span>
                  <span className='text-muted-foreground'>/unique</span>
                </div>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {plan.description}
                </p>
              </div>

              <ul className='mb-8 flex-1 space-y-4'>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className='flex items-center gap-3 text-sm text-foreground/80'
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full",
                        plan.highlight
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Check className='h-3 w-3' />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={`/create/plan?selected=${plan.highlight ? "premium" : "experience"}`}
                className='mt-auto'
              >
                <div
                  className={cn(
                    "w-full rounded-full py-3 text-sm font-semibold transition-all text-center",
                    plan.highlight
                      ? "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg"
                      : "bg-card border border-input text-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {plan.cta}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { cn } from "@shared/lib/utils";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { FadeIn } from "./FadeIn";

const FAQS = [
  {
    question: "Puis-je modifier mon site après l'envoi des invitations ?",
    answer:
      "Absolument ! C'est la magie du digital. Vous pouvez modifier les horaires, ajouter des infos sur l'hébergement ou changer une photo à tout moment. Vos invités verront toujours la version à jour.",
  },
  {
    question: "Est-ce que je dois payer un abonnement mensuel ?",
    answer:
      "Non, jamais. Le paiement est unique. Votre site reste en ligne pendant 12 mois après votre mariage, ce qui vous laisse le temps de partager les photos souvenirs.",
  },
  {
    question: "Comment mes invités confirment-ils leur présence (RSVP) ?",
    answer:
      "Un formulaire simple et élégant est intégré à votre site. Vous recevez les réponses instantanément dans votre tableau de bord (et par email si vous le souhaitez). Vous pouvez exporter la liste des invités en un clic.",
  },
  {
    question: "Puis-je avoir un nom de domaine personnalisé ?",
    answer:
      "Oui ! Avec l'option « Custom Domain » (+65€) ou incluse dans le pack Premium, vous pouvez avoir une adresse comme www.paula-et-marcos.com.",
  },
  {
    question: "Proposez-vous des faire-part papier assortis ?",
    answer:
      "Nous nous concentrons sur l'expérience digitale pour l'instant, mais nous pouvons vous fournir les fichiers PDF haute définition de votre design pour que vous puissiez les imprimer chez votre imprimeur local.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden bg-studio-creme px-6 py-20 md:px-12">
      <Image
        src="/images/leaf-bottom-lavande.svg"
        alt=""
        width={106}
        height={188}
        className="pointer-events-none absolute -bottom-6 left-0 h-auto w-24 rotate-90 md:w-32"
      />

      <FadeIn className="mx-auto mb-14 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>Une question ?</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          Questions
          <br />
          <span className="text-studio-lavande">Fréquentes</span>
        </h2>
      </FadeIn>

      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <FadeIn key={faq.question} delay={index * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-studio-lavande/40 bg-white">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 p-6 text-left"
                  >
                    <span className="font-heading text-lg text-studio-violet md:text-xl">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-studio-lavande text-studio-violet transition-colors",
                        isOpen && "bg-studio-lavande text-studio-violet",
                      )}
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>
                </h3>

                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 pt-0 font-body text-sm leading-relaxed text-studio-violet/70 md:text-base">
                    {faq.answer}
                  </p>
                </motion.div>
              </div>
            </FadeIn>
          );
        })}
      </div>
    </section>
  );
}

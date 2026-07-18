"use client";

import { motion } from "framer-motion";
import { Leaf, Palette, Send, Smartphone, Zap } from "lucide-react";
import Image from "next/image";

const REASONS = [
  {
    icon: Palette,
    title: ["Design digne des plus", "belles papeteries"],
    description:
      "L'élégance de la papeterie, sans les contraintes du papier.",
  },
  {
    icon: Send,
    title: ["Zéro logistique"],
    description:
      "Pas d'impression. Pas de timbres. Pas de « Tu as pensé à poster les 150 faire-part ? »",
  },
  {
    icon: Smartphone,
    title: ["Toujours à portée de main"],
    description:
      "Fini les faire-part dans un tiroir. Vos invités retrouvent toutes les informations en un clic.",
  },
  {
    icon: Leaf,
    title: ["Écologique"],
    description:
      "Les arbres vous disent merci. Une invitation sans impression ni transport.",
  },
  {
    icon: Zap,
    title: ["Instantané"],
    description:
      "Envoyé en un clic, reçu dans la seconde. Pas de délai d'impression, pas d'attente postale.",
  },
];

export function WhyUs() {
  return (
    <section className="relative overflow-hidden bg-studio-creme px-6 py-20 md:px-12">
      <Image
        src="/images/leaf-top-lavande.svg"
        alt=""
        width={94}
        height={138}
        className="pointer-events-none absolute right-0 top-[26rem] h-auto w-24 -scale-x-100 rotate-[80deg] md:w-32"
      />

      <div className="mx-auto mb-14 max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 font-body text-h5 tracking-luxe text-studio-pourpre">
          <Image
            src="/images/eyebrow-separator-left.svg"
            alt=""
            width={42}
            height={1}
          />
          <span>Pourquoi choisir The Studio ?</span>
          <Image
            src="/images/eyebrow-separator-right.svg"
            alt=""
            width={42}
            height={1}
          />
        </div>
        <h2 className="mt-4 font-heading text-h1 text-studio-violet">
          L'élégance de la papeterie,
          <br />
          <span className="text-studio-lavande">
            la puissance du numérique
          </span>
        </h2>
      </div>

      <div className="mx-auto flex max-w-2xl flex-col gap-14">
        {REASONS.map(({ icon: Icon, title, description }) => (
          <motion.div
            key={title[0]}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-studio-lavande shadow-sm">
              <Icon className="h-6 w-6 text-studio-violet" />
            </div>
            <h3 className="mt-5 font-heading text-h2 text-studio-violet">
              {title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h3>
            <p className="mt-3 max-w-md font-body text-sm text-studio-violet/70 md:text-base">
              {description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

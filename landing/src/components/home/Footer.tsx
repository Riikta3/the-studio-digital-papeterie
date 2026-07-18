import { Button } from "@shared/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const PRODUCT_LINKS = [
  { label: "Démo", href: "#" },
  { label: "Fonctionnalités", href: "#" },
  { label: "Tarifs", href: "#" },
  { label: "Témoignages", href: "#" },
  { label: "FAQ", href: "#" },
  { label: "Sur-mesure", href: "#" },
];

const MARIES_LINKS = [{ label: "Se connecter", href: "/login" }];

const LEGAL_LINKS = [
  { label: "CGV", href: "/legal/cgv" },
  { label: "Confidentialité", href: "/legal/privacy" },
];

export function Footer() {
  return (
    <div className="relative overflow-hidden border-t border-white/10 px-6 py-14 md:px-12">
      <Image
        src="/images/hero-leaf-bottom.svg"
        alt=""
        width={106}
        height={188}
        className="pointer-events-none absolute -right-4 top-16 h-auto w-24 md:-right-6 md:w-32"
      />

      <div className="relative mx-auto grid max-w-4xl grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3">
        <div className="col-span-2 md:col-span-1">
          <Image
            src="/logo.svg"
            alt="The Studio Digital Papeterie"
            width={40}
            height={42}
          />
        </div>

        <nav>
          <p className="font-body text-h5 tracking-luxe text-white/50">
            Produit
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="font-body text-sm text-studio-jaune hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav>
          <p className="font-body text-h5 tracking-luxe text-white/50">
            Mariés
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {MARIES_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="font-body text-sm text-studio-jaune hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <Button variant="studio-jaune" size="pill" className="mt-4">
            Créer mon invitation <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="mt-8 font-body text-h5 tracking-luxe text-white/50">
            Légal
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="font-body text-sm text-studio-jaune hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

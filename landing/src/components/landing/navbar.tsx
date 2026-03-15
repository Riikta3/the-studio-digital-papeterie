"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

// Note: scrollTo only works when navbar is rendered on the home page.
// If Navbar is ever moved to a shared layout, these should become href="/#anchor" Links.
const NAV_LINKS = [
  { key: "demo" as const, anchor: "demo-viewer" },
  { key: "features" as const, anchor: "comment-ca-marche" },
  { key: "pricing" as const, anchor: "comparatif" },
  { key: "testimonials" as const, anchor: "temoignages" },
] as const;

export function Navbar() {
  const t = useTranslations("Navbar");
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const scrollTo = (anchor: string) => {
    setIsMobileMenuOpen(false);
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "py-4" : "py-6",
      )}
    >
      <div className='container mx-auto px-4'>
        <div
          className={cn(
            "mx-auto flex items-center justify-between px-6 transition-all duration-300",
            isScrolled
              ? "rounded-full bg-card/80 backdrop-blur-md shadow-sm border border-border/20 py-3 max-w-7xl"
              : "bg-transparent py-2 max-w-7xl",
          )}
        >
          {/* Logo */}
          <Link
            href='/'
            className='flex items-center gap-2 z-50 shrink-0'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className='relative h-10 w-36'>
              <Image
                src='/images/logo-the-studio-rectangulaire.svg'
                alt='The Studio Digital Papeterie — Faire-part digital haut de gamme'
                fill
                className='object-contain mix-blend-multiply'
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className='hidden lg:flex items-center gap-8'>
            {NAV_LINKS.map(({ key, anchor }) => (
              <button
                key={key}
                onClick={() => scrollTo(anchor)}
                className='text-sm font-medium text-muted-foreground hover:text-primary transition-colors'
              >
                {t(key)}
              </button>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className='hidden lg:flex items-center gap-6 shrink-0'>
            <Link
              href='/login'
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              {t("login")}
            </Link>
            <LanguageSwitcher />
            <Link
              href='/create'
              className='rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95 whitespace-nowrap'
            >
              {t("createButton")}
            </Link>
          </div>

          {/* Mobile — CTA pill + burger */}
          <div className='flex items-center gap-3 lg:hidden z-50'>
            <Link
              href='/create'
              onClick={() => setIsMobileMenuOpen(false)}
              className='rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-md active:scale-95 whitespace-nowrap'
            >
              {t("createButton")}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='p-2 text-foreground'
              aria-label='Toggle menu'
            >
              {isMobileMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 z-40 flex flex-col bg-background pt-24 px-6 lg:hidden overflow-y-auto'
          >
            <nav className='flex flex-col gap-6 items-center pb-8'>
              <div className='mb-4'>
                <LanguageSwitcher />
              </div>
              {NAV_LINKS.map(({ key, anchor }) => (
                <button
                  key={key}
                  onClick={() => scrollTo(anchor)}
                  className='text-2xl font-heading font-medium text-foreground hover:text-primary transition-colors'
                >
                  {t(key)}
                </button>
              ))}
              <div className='w-12 h-[1px] bg-border my-2' />
              <Link
                href='/login'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-muted-foreground hover:text-primary'
              >
                {t("login")}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

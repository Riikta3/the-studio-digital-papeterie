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
import { ChevronDown, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function Navbar() {
  const t = useTranslations("Navbar");
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductMenuOpen, setIsProductMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

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
            "mx-auto flex items-center justify-between rounded-full px-6 transition-all duration-300",
            isScrolled
              ? "bg-card shadow-lg border border-border/50 py-3 max-w-5xl"
              : "bg-transparent py-2 max-w-7xl",
          )}
        >
          {/* Logo */}
          <Link
            href='/'
            className='flex items-center gap-2 z-50 shrink-0'
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className='font-heading text-2xl font-bold tracking-tight text-foreground'>
              MeetMyWedding
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className='hidden md:flex items-center gap-8'>
            {/* Dropdown for Product Features */}
            <div
              className='relative group'
              onMouseEnter={() => setIsProductMenuOpen(true)}
              onMouseLeave={() => setIsProductMenuOpen(false)}
            >
              <button className='flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2'>
                {t("product")} <ChevronDown className='w-4 h-4' />
              </button>

              <AnimatePresence>
                {isProductMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className='absolute top-full left-1/2 -translate-x-1/2 pt-2 w-48'
                  >
                    <div className='bg-card border border-border/50 rounded-xl shadow-xl overflow-hidden p-2 flex flex-col'>
                      <Link
                        href='#fonctionnalites'
                        className='px-4 py-2 hover:bg-muted/50 rounded-lg text-sm text-foreground/80 hover:text-primary transition-colors text-start'
                      >
                        {t("features")}
                      </Link>
                      <Link
                        href='#apercu'
                        className='px-4 py-2 hover:bg-muted/50 rounded-lg text-sm text-foreground/80 hover:text-primary transition-colors text-start'
                      >
                        {t("dashboard")}
                      </Link>
                      <Link
                        href='#modeles'
                        className='px-4 py-2 hover:bg-muted/50 rounded-lg text-sm text-foreground/80 hover:text-primary transition-colors text-start'
                      >
                        {t("themes")}
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              href='#temoignages'
              className='text-sm font-medium text-foreground/80 hover:text-primary transition-colors'
            >
              {t("testimonials")}
            </Link>
            <Link
              href='#tarifs'
              className='text-sm font-medium text-foreground/80 hover:text-primary transition-colors'
            >
              {t("pricing")}
            </Link>
            <Link
              href='#faq'
              className='text-sm font-medium text-foreground/80 hover:text-primary transition-colors'
            >
              {t("faq")}
            </Link>
          </nav>

          {/* CTA & Toggle (Desktop) */}
          <div className='hidden md:flex items-center gap-4 shrink-0'>
            <LanguageSwitcher />
            <Link href='/create/plan'>
              <button className='rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:shadow-xl active:scale-95 whitespace-nowrap'>
                {t("createButton")}
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className='flex items-center gap-4 md:hidden z-50'>
            <LanguageSwitcher />
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
            className='fixed inset-0 z-40 flex flex-col bg-background pt-24 px-6 md:hidden overflow-y-auto'
          >
            <nav className='flex flex-col gap-6 items-center pb-8'>
              <span className='text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2'>
                {t("product")}
              </span>
              <Link
                href='#fonctionnalites'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-foreground hover:text-primary'
              >
                {t("features")}
              </Link>
              <Link
                href='#apercu'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-foreground hover:text-primary'
              >
                {t("dashboard")}
              </Link>
              <Link
                href='#modeles'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-foreground hover:text-primary'
              >
                {t("themes")}
              </Link>

              <div className='w-12 h-[1px] bg-border my-2' />

              <Link
                href='#temoignages'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-foreground hover:text-primary'
              >
                {t("testimonials")}
              </Link>
              <Link
                href='#tarifs'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-foreground hover:text-primary'
              >
                {t("pricing")}
              </Link>
              <Link
                href='#faq'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-foreground hover:text-primary'
              >
                {t("faq")}
              </Link>

              <div className='mt-8 flex flex-col w-full gap-4'>
                <Link
                  href='/create/plan'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='w-full'
                >
                  <button className='w-full rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-95'>
                    {t("createButton")}
                  </button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

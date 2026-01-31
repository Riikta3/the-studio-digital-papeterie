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
import { useState } from "react";

export function Navbar() {
  const t = useTranslations("Navbar");
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              ? "bg-card/80 backdrop-blur-md shadow-sm border border-border/20 py-3 max-w-5xl"
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
              The Studio Digital Papeterie
            </span>
          </Link>

          {/* Desktop Actions (Clean & Minimalist) */}
          <div className='hidden lg:flex items-center gap-6 shrink-0'>
            <Link
              href='/login'
              className='text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            >
              {t("login")}
            </Link>

            <LanguageSwitcher />

            <Link
              href='/create/plan'
              className='rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95 whitespace-nowrap'
            >
              {t("createButton")}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className='flex items-center gap-4 lg:hidden z-50'>
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
              {/* Language Switcher moved here */}
              <div className='mb-4'>
                <LanguageSwitcher />
              </div>

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
                href='/login'
                onClick={() => setIsMobileMenuOpen(false)}
                className='text-lg font-heading font-medium text-muted-foreground hover:text-primary'
              >
                {t("login")}
              </Link>

              <div className='mt-8 flex flex-col w-full gap-4'>
                <Link
                  href='/create/plan'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className='w-full rounded-full bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg active:scale-95 text-center'
                >
                  {t("createButton")}
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

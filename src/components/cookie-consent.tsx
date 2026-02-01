"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function CookieConsent() {
  const t = useTranslations("CookieConsent");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className='fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none'
      >
        <div className='container mx-auto max-w-4xl pointer-events-auto'>
          <div className='bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8'>
            <div className='flex-1 text-center md:text-left'>
              <p className='text-foreground text-sm md:text-base font-medium'>
                {t("bannerText")}
              </p>
              <Link
                href='/legal/privacy'
                className='text-xs text-muted-foreground underline hover:text-primary mt-1 inline-block transition-colors'
              >
                {t("learnMore")}
              </Link>
            </div>
            <div className='flex flex-col sm:flex-row gap-3 w-full md:w-auto'>
              <Button
                variant='outline'
                onClick={handleDecline}
                className='w-full sm:w-auto whitespace-nowrap'
              >
                {t("declineButton")}
              </Button>
              <Button
                onClick={handleAccept}
                className='w-full sm:w-auto whitespace-nowrap shadow-md'
              >
                {t("acceptButton")}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

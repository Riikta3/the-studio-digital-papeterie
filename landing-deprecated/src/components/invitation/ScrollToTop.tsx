"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useInvitationContext } from "./InvitationContext";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { activeTheme } = useInvitationContext();

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 500);
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg hover:-translate-y-1 transition-all duration-300 theme-${activeTheme} bg-primary text-primary-foreground hover:opacity-90`}
          aria-label='Retour en haut'
        >
          <ArrowUp className='w-5 h-5' />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

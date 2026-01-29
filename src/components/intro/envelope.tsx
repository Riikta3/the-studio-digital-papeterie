"use client";

import { AnimatePresence, motion, type Transition } from "framer-motion";
import * as React from "react";

const flapTransition: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 18,
};

export default function MagicEnvelope() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isDismissed, setIsDismissed] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => setIsDismissed(true), 900);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          className='fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm'
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <button
            type='button'
            aria-label="Ouvrir l'enveloppe"
            onClick={handleOpen}
            className='relative h-[220px] w-[320px] outline-none'
            style={{ perspective: 1000 }}
          >
            <motion.div
              className='absolute bottom-10 left-1/2 h-28 w-40 -translate-x-1/2 rounded-md bg-white shadow-xl'
              animate={isOpen ? { y: -100, opacity: 1 } : { y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 140,
                damping: 20,
                delay: 0.05,
              }}
            />

            <motion.svg
              viewBox='0 0 300 200'
              className='h-full w-full drop-shadow-xl'
              aria-hidden
              style={{ transformStyle: "preserve-3d" }}
            >
              <path
                d='M20 60 L150 150 L280 60 V170 H20 Z'
                className='fill-muted/70 stroke-border'
                strokeWidth='2'
              />
              <path
                d='M20 60 L150 150 L280 60'
                className='fill-transparent stroke-border/60'
                strokeWidth='2'
              />
              <motion.path
                d='M20 60 L150 10 L280 60 Z'
                className='fill-secondary/80 stroke-border'
                strokeWidth='2'
                style={{
                  transformOrigin: "top center",
                  transformBox: "fill-box",
                  transformStyle: "preserve-3d",
                }}
                animate={isOpen ? { rotateX: 180 } : { rotateX: 0 }}
                transition={flapTransition}
              />
            </motion.svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

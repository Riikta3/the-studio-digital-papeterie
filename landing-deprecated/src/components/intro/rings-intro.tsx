"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface RingsIntroProps {
  onComplete: () => void;
}

export function RingsIntro({ onComplete }: RingsIntroProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Animation sequence duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for fade out
    }, 2500); // Keep intro for 2.5s

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className='fixed inset-0 z-[100] flex items-center justify-center bg-[#FDFBF7] overflow-hidden'
        >
          {/* Fairy-tale Background Elements */}
          <div className='absolute inset-0 z-0'>
            <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse' />
            <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000' />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.svg')] opacity-20" />
          </div>

          <div className='relative z-10 flex items-center justify-center'>
            {/* Left Ring */}
            <motion.svg
              width='120'
              height='120'
              viewBox='0 0 100 100'
              className='absolute'
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: -15, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <circle
                cx='50'
                cy='50'
                r='40'
                fill='none'
                stroke='#D4AF37'
                strokeWidth='8'
              />
              <circle
                cx='50'
                cy='50'
                r='40'
                fill='none'
                stroke='white'
                strokeWidth='2'
                strokeOpacity='0.5'
              />
            </motion.svg>

            {/* Right Ring */}
            <motion.svg
              width='120'
              height='120'
              viewBox='0 0 100 100'
              className='absolute'
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 15, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            >
              <circle
                cx='50'
                cy='50'
                r='40'
                fill='none'
                stroke='#C0C0C0'
                strokeWidth='8'
              />
              <circle
                cx='50'
                cy='50'
                r='40'
                fill='none'
                stroke='white'
                strokeWidth='2'
                strokeOpacity='0.5'
              />
            </motion.svg>

            {/* Sparkle Effect in Center */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className='absolute z-20'
            >
              <svg
                width='40'
                height='40'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z'
                  fill='#D4AF37'
                />
              </svg>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className='absolute bottom-20 text-primary/60 font-heading tracking-widest text-sm'
          >
            THE STUDIO PAPETERIE DIGITAL
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

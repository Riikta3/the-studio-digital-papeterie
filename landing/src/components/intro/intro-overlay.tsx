"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useState } from "react";

interface IntroOverlayProps {
  onComplete: () => void;
}

export function IntroOverlay({ onComplete }: IntroOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showContent, setShowContent] = useState(true);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);

    // Start fading out the overlay quickly so the site reveals AS the envelope opens
    setTimeout(() => {
      setShowContent(false);
      setTimeout(onComplete, 1500); // Wait for fade out to finish before unmounting
    }, 400); // Adjusted to 400ms for a snappy response
  };

  return (
    <AnimatePresence>
      {showContent && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className='fixed inset-0 z-[100] flex items-center justify-center bg-[#FDFBF7] bg-noise'
        >
          <div className='relative flex flex-col items-center'>
            <div className='relative flex items-center justify-center [perspective:1200px] scale-90 md:scale-[1.5] xl:scale-[2.0]'>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1 }}
                className='relative cursor-pointer'
                onClick={handleOpen}
              >
                {/* Wrapper to control hover/click state */}
                <div
                  className={cn(
                    "relative h-[220px] w-[300px] transition-transform duration-500 [transform-style:preserve-3d]",
                    isOpen ? "translate-y-32" : "",
                  )}
                >
                  {/* 1. Back Face (Inside color) */}
                  <div className='absolute inset-0 z-0 bg-[#e6dfd5] shadow-xl' />

                  {/* 2. The Card (HTML content) */}
                  <div
                    className={cn(
                      "absolute inset-x-4 z-10 flex flex-col items-center justify-center bg-white p-6 shadow-sm transition-all duration-700 ease-in-out border border-neutral-100",
                      isOpen
                        ? "-translate-y-32 h-[200px] shadow-md transition-delay-300" // Card slides OUT with delay
                        : "top-2 bottom-2 h-auto", // Card sits inside
                    )}
                  >
                    <div className='text-center w-full'>
                      <p className='font-heading text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3'>
                        Save the Date
                      </p>
                      <h3 className='mb-2 font-heading text-3xl font-bold text-primary'>
                        Paula & Marcos
                      </h3>
                      <div className='flex items-center justify-center gap-3 my-3'>
                        <span className='h-[1px] w-8 bg-neutral-200'></span>
                        <p className='text-xs text-muted-foreground font-serif italic'>
                          12 . 08 . 2026
                        </p>
                        <span className='h-[1px] w-8 bg-neutral-200'></span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Front Flaps (SVG Overlay) - Z-index > Card */}
                  <svg
                    className='absolute inset-0 z-20 pointer-events-none drop-shadow-sm w-full h-full'
                    viewBox='0 0 320 220'
                    preserveAspectRatio='none'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M0 0L160 110L0 220V0Z'
                      fill='#f0ece6'
                    />
                    <path
                      d='M320 0L160 110L320 220V0Z'
                      fill='#f0ece6'
                    />
                    <path
                      d='M0 220L160 110L320 220H0Z'
                      fill='#fdfbf7'
                    />
                  </svg>

                  {/* 4. Top Flap (Animated) */}
                  <div
                    className={cn(
                      "absolute top-0 left-0 right-0 h-[110px] [perspective:1000px] transition-all duration-500 ease-in-out",
                      isOpen ? "z-0 opacity-0" : "z-30 opacity-100 delay-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-full h-full origin-top transition-all duration-700 ease-in-out [transform-style:preserve-3d]",
                        isOpen
                          ? "[transform:rotateX(180deg)]"
                          : "[transform:rotateX(0deg)]",
                      )}
                    >
                      {/* Front of Top Flap */}
                      <div className='absolute inset-0 [backface-visibility:hidden]'>
                        <svg
                          viewBox='0 0 320 110'
                          fill='none'
                          preserveAspectRatio='none'
                          xmlns='http://www.w3.org/2000/svg'
                          className='w-full h-full drop-shadow-md'
                        >
                          <path
                            d='M0 0L160 110L320 0H0Z'
                            fill='#fdfbf7'
                          />
                        </svg>
                        {/* Wax Seal */}
                        <div className='absolute bottom-[-20px] left-1/2 -translate-x-1/2 flex items-center justify-center z-40'>
                          <div className='relative flex h-10 w-10 items-center justify-center rounded-full bg-[#8a2c2c] shadow-lg ring-2 ring-[#8a2c2c]/30 border border-white/20'>
                            <div className='absolute inset-0 rounded-full border border-white/10' />
                            <Heart className='h-4 w-4 text-[#e8baba] fill-[#e8baba] drop-shadow-sm' />
                          </div>
                        </div>
                      </div>

                      {/* Back of Top Flap */}
                      <div className='absolute inset-0 [backface-visibility:hidden] [transform:rotateX(180deg)]'>
                        <svg
                          viewBox='0 0 320 110'
                          fill='none'
                          preserveAspectRatio='none'
                          xmlns='http://www.w3.org/2000/svg'
                          className='w-full h-full'
                        >
                          <path
                            d='M0 0L160 110L320 0H0Z'
                            fill='#f0ece6'
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

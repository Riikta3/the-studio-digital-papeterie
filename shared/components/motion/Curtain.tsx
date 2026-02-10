"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function Curtain() {
  const [isVisible, setIsVisible] = useState(true);

  const handleOpen = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className='fixed inset-0 z-[100] flex cursor-pointer'
          onClick={handleOpen}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 2.2, duration: 0.8 } }}
        >
          {/* Left Curtain Panel */}
          <motion.div
            className='h-full w-1/2 bg-[#4a0404] relative'
            initial={{ x: "0%" }}
            exit={{
              x: "-100%",
              // Physics Simulation:
              // 1. Skew: Sways heavily at start as it's pulled, then settles.
              // 2. ScaleX: Compresses (bunches) as it moves fast, then relaxes.
              skewX: [0, 10, -5, 2, 0],
              scaleX: [1, 0.8, 0.9, 1, 1],
              transition: {
                duration: 2.5, // Reduced from 3.5s for a faster finish
                ease: [0.22, 1, 0.36, 1], // Cubic bezier for "heavy" start/end
                times: [0, 0.2, 0.5, 0.8, 1], // Timing of keyframes
              },
            }}
            style={{
              boxShadow: "10px 0 50px rgba(0,0,0,0.8)",
              borderRight: "6px solid #2d0202",
              transformOrigin: "top left", // Pivot from top corner
            }}
          >
            {/* Deep Fabric Folds */}
            <div
              className='absolute inset-0'
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #300000 0%, #5a0505 20%, #7a1010 40%, #5a0505 60%, #300000 80%, #200000 100%)",
                backgroundSize: "80px 100%",
                boxShadow: "inset 0 0 100px black",
              }}
            />
            {/* Texture Overlay */}
            <div
              className='absolute inset-0 opacity-30 mix-blend-overlay'
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
          </motion.div>

          {/* Right Curtain Panel */}
          <motion.div
            className='h-full w-1/2 bg-[#4a0404] relative'
            initial={{ x: "0%" }}
            exit={{
              x: "100%",
              skewX: [0, -10, 5, -2, 0], // Opposite skew
              scaleX: [1, 0.8, 0.9, 1, 1],
              transition: {
                duration: 2.5, // Reduced from 3.5s
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.2, 0.5, 0.8, 1],
              },
            }}
            style={{
              boxShadow: "-10px 0 50px rgba(0,0,0,0.8)",
              borderLeft: "6px solid #2d0202",
              transformOrigin: "top right", // Pivot from top corner
            }}
          >
            {/* Deep Fabric Folds */}
            <div
              className='absolute inset-0'
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #300000 0%, #5a0505 20%, #7a1010 40%, #5a0505 60%, #300000 80%, #200000 100%)",
                backgroundSize: "80px 100%",
                boxShadow: "inset 0 0 100px black",
              }}
            />
            {/* Texture Overlay */}
            <div
              className='absolute inset-0 opacity-30 mix-blend-overlay'
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

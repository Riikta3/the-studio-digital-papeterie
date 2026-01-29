"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function RingsBadge() {
  return (
    <div className='inline-flex items-center justify-center p-3 rounded-full border border-primary/20 bg-background/50 backdrop-blur-sm shadow-sm'>
      <div className='relative flex items-center justify-center w-12 h-8'>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className='relative w-12 h-12'
        >
          <Image
            src='/rings-icon.png'
            alt='Wedding Rings'
            fill
            className='object-contain'
          />
        </motion.div>
      </div>
    </div>
  );
}

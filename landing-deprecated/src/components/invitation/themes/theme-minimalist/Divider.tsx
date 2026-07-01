"use client";

import { motion } from "framer-motion";

export function Divider() {
  return (
    <div className='w-full py-16 md:py-24 flex items-center justify-center pointer-events-none'>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className='flex items-center gap-6'
      >
        <div className='h-px w-16 md:w-32 bg-primary/20' />
        <div className='w-2 h-2 rounded-full border border-primary/40 rotate-45' />
        <div className='h-px w-16 md:w-32 bg-primary/20' />
      </motion.div>
    </div>
  );
}

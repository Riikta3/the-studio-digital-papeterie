"use client";

import { motion } from "framer-motion";

// Shared scroll-reveal used across the home sections: fade + slide-up
// when the element enters the viewport, once.
export function FadeIn({
  children,
  className,
  style,
  delay = 0,
  amount = 0.4,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  // Lower this for tall blocks (taller than the viewport) so the reveal
  // still triggers when only a small part is visible.
  amount?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

"use client";
import { motion } from "framer-motion";

// Filtre CSS pour teindre un PNG noir en #0E2F44 (bleu nuit)
const FILTER_NUIT =
  "brightness(0) saturate(100%) invert(13%) sepia(40%) saturate(800%) hue-rotate(178deg) brightness(80%)";

interface DividerProps {
  variant?: "plane-path" | "plane-hearts";
}

export function Divider({ variant = "plane-path" }: DividerProps) {
  const src =
    variant === "plane-hearts"
      ? "/videos/theme/travel/Image iLoveIMG (5).png"
      : "/videos/theme/travel/Image iLoveIMG (2).png";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex justify-center items-center my-8 px-8"
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="w-36 md:w-48"
        style={{ filter: FILTER_NUIT, opacity: 0.75 }}
      />
    </motion.div>
  );
}

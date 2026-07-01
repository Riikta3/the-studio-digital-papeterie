"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { cn } from "../../lib/utils";

export function SplitText({
  text,
  as: Tag = "span",
  className,
  wordClassName,
  staggerDelay = 0.12,
  initialDelay = 0,
  duration = 0.5,
  fromColor = "rgba(255,255,255,0.25)",
  toColor = "rgba(255,255,255,1)",
}: {
  text: string;
  as?: React.ElementType;
  className?: string;
  wordClassName?: string;
  staggerDelay?: number;
  initialDelay?: number;
  duration?: number;
  fromColor?: string;
  toColor?: string;
}) {
  const words = text.split(" ");

  return (
    <Tag className={cn(className)}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <motion.span
            className={cn("inline-block", wordClassName)}
            initial={{ color: fromColor }}
            animate={{ color: toColor }}
            transition={{
              duration,
              delay: initialDelay + index * staggerDelay,
              ease: "easeOut",
            }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

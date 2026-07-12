"use client";

import { motion } from "framer-motion";
import * as React from "react";

import { cn } from "../../lib/utils";

// Fade in + bottom→up translation, one word at a time.
// Delays are explicit (startDelay + index * stagger) so a continuous, global
// word-by-word sequence can span multiple SplitText blocks (eyebrow → title →
// subtitle): pass a running startDelay and read `wordCount` back to chain them.
export function SplitText({
  text,
  as: Tag = "span",
  className,
  wordClassName,
  startDelay = 0,
  stagger = 0.11,
  duration = 0.65,
}: {
  text: string;
  as?: React.ElementType;
  className?: string;
  wordClassName?: string;
  startDelay?: number;
  stagger?: number;
  duration?: number;
}) {
  const words = text.split(" ");

  return (
    <Tag className={cn(className)}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <motion.span
            className={cn("inline-block", wordClassName)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: startDelay + index * stagger,
              opacity: { duration: 0.15, ease: "easeOut" },
              y: { duration, ease: "easeOut" },
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

// Count words the same way SplitText splits them — used to chain startDelays.
export function countWords(text: string) {
  return text.split(" ").length;
}

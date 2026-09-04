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
  stagger = 0.2,
  duration = 0.4,
  animate = true,
}: {
  text: string;
  as?: React.ElementType;
  className?: string;
  wordClassName?: string;
  startDelay?: number;
  stagger?: number;
  duration?: number;
  // Set false to render the text plainly, with no per-word motion. Use it for
  // copy that is already in the initial viewport: every word starts at
  // opacity 0, so animating above-the-fold text delays the largest paint
  // instead of decorating it.
  animate?: boolean;
}) {
  const words = text.split(" ");

  // No wrappers, no motion, no invisible initial state — just the text, so it
  // is present and painted in the server-rendered HTML.
  if (!animate) return <Tag className={cn(className)}>{text}</Tag>;

  return (
    <Tag className={cn(className)}>
      {words.map((word, index) => (
        <React.Fragment key={`${word}-${index}`}>
          <motion.span
            className={cn("inline-block", wordClassName)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: {
                duration: 0.3,
                delay: startDelay + index * stagger,
                ease: "easeOut",
              },
              y: {
                duration,
                delay: startDelay + index * stagger,
                ease: "easeOut",
              },
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

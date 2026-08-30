"use client";

import { useEffect } from "react";

/** Matches the `transition-delay` ladder the source expressed in CSS. */
const DELAYS = [0.06, 0.16, 0.28, 0.4];
const TAIL_DELAY = 0.5;

/**
 * Drives the scroll-in typography.
 *
 * The source ran this observer from its page component and staggered the
 * children with `.reveal.visible > :nth-child(n)` rules. Those rules counted
 * DOM position, which is exactly what changes when a wedding leaves a module
 * out, so the delays are written as inline styles here instead — the ladder
 * then restarts correctly inside every `.reveal`, whichever sections rendered.
 *
 * Rendered once by the theme root; it draws nothing.
 */
export function RevealObserver() {
  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(".theme-blanc-couture .reveal"));

    for (const block of blocks) {
      Array.from(block.children).forEach((child, index) => {
        (child as HTMLElement).style.transitionDelay = `${DELAYS[index] ?? TAIL_DELAY}s`;
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        }
      },
      { threshold: 0.12 },
    );

    for (const block of blocks) observer.observe(block);
    return () => observer.disconnect();
  }, []);

  return null;
}

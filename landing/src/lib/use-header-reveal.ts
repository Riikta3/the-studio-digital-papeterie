"use client";

import { useEffect, useRef, useState } from "react";

// Scroll delta required to flip direction. Without it, the sub-pixel jitter of
// a trackpad or a momentum scroll settling makes the header flicker in and
// out.
const DIRECTION_THRESHOLD = 8;

/**
 * "Hide on scroll down, come back on scroll up" for a fixed header.
 *
 * Returns whether the header should currently be shown. Below `revealAfter`
 * the answer is always `false`: that top zone is where the page's own inline
 * header still sits, and a floating copy of it there is just a duplicate.
 */
export function useHeaderReveal(revealAfter: number) {
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      // Ignore the noise, but do NOT update lastY on an ignored frame: a slow
      // deliberate scroll arrives as many sub-threshold deltas that would each
      // be discarded, so the direction has to accumulate.
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return;

      // Bounce past the top (iOS rubber-banding) reports upward deltas while
      // the top of the page is still in view — that zone is always "hidden".
      if (y < revealAfter) setVisible(false);
      else setVisible(delta < 0);

      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealAfter]);

  return visible;
}

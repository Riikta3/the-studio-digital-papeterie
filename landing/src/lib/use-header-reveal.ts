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

      // The top zone is checked BEFORE the noise threshold, and wins outright.
      // Two reasons it cannot live below the early return:
      //   - Drifting into it in sub-threshold steps (a slow wheel, momentum
      //     settling) would return early every frame, so the header stayed
      //     revealed and overlapped the page's own inline nav.
      //   - Bounce past the top (iOS rubber-banding) reports upward deltas
      //     while the inline nav is fully in view, which reads as "scrolling
      //     up" and would reveal the floating copy on top of it.
      if (y < revealAfter) {
        setVisible(false);
        lastY.current = y;
        return;
      }

      const delta = y - lastY.current;

      // Ignore the noise, but do NOT update lastY on an ignored frame: a slow
      // deliberate scroll arrives as many sub-threshold deltas that would each
      // be discarded, so the direction has to accumulate.
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return;

      setVisible(delta < 0);
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealAfter]);

  return visible;
}

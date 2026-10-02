"use client";

import { useEffect, useRef } from "react";

/**
 * Nudges every section a few pixels against the scroll (`--section-shift`, and a
 * softer `--section-shift-soft`) so the painted decorations drift. The designer
 * did it on every `.section` of the document; this does it for its own theme
 * root, from one throttled scroll listener that it removes, and not at all for
 * a reader who asked for no motion.
 */
export function ParallaxShift() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = marker.current?.closest("[data-theme-root]");
    if (!root) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      root.querySelectorAll<HTMLElement>(".section").forEach((section) => {
        const rect = section.getBoundingClientRect();
        const shift = Math.max(-24, Math.min(24, (window.innerHeight / 2 - rect.top - rect.height / 2) * 0.045));
        section.style.setProperty("--section-shift", `${shift}px`);
        section.style.setProperty("--section-shift-soft", `${shift * 0.45}px`);
      });
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={marker} hidden aria-hidden="true" />;
}

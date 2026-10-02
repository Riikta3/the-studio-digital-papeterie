"use client";

import { type ElementType, type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Reveal-on-scroll, scoped to one element.
 *
 * The designers' sheets hide each section (`opacity: 0.01`) until a script adds
 * a class, and their scripts do it with a global `document.querySelectorAll`.
 * In this app that captures other components' elements and fights the editor's
 * live preview, so a section observes itself instead.
 *
 * - The class is added once, then the observer is dropped.
 * - Under `prefers-reduced-motion`, or with no `IntersectionObserver`, it is
 *   added at once: nothing stays hidden for a reader who asked for no motion.
 * - The class lives in React state, so a later change of `className` does not
 *   wipe it.
 *
 * Without JavaScript a section would stay at `opacity: 0.01`; the theme's own
 * CSS undoes that for a root with no `data-js` (see `JsFlag`).
 */
type DataAttributes = { [key: `data-${string}`]: string | undefined };

type RevealProps = DataAttributes & {
  as?: ElementType;
  id?: string;
  className?: string;
  /** Added once the element has been seen: `in-view`, `visible`… */
  revealedClass: string;
  /** Share of the element that must be on screen. */
  threshold?: number;
  children?: ReactNode;
};

export function Reveal({
  as: Tag = "div",
  className,
  revealedClass,
  threshold = 0.15,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen, threshold]);

  const classes = [className, seen ? revealedClass : null].filter(Boolean).join(" ");
  return (
    <Tag ref={ref} className={classes || undefined} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Marks the theme root as "scripts are running" (`data-js`).
 *
 * The theme's CSS hides revealable sections only under `[data-js]`, so a
 * visitor with JavaScript off still reads the whole invitation. Render it once,
 * anywhere inside the root; the root carries `data-theme-root=""`.
 */
export function JsFlag() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = ref.current?.closest("[data-theme-root]");
    root?.setAttribute("data-js", "");
    return () => root?.removeAttribute("data-js");
  }, []);

  return <span ref={ref} hidden aria-hidden="true" />;
}

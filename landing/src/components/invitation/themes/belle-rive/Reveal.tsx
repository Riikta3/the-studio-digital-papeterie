"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

/**
 * Fade-and-rise wrapper for one block of content.
 *
 * The source did this by querying `.panel :is(p,h1,h2,img,video,…)` from a
 * `useEffect` and mutating every match. That works in a single-page project and
 * is unusable here: `document.querySelectorAll` does not stop at the theme's
 * subtree, so inside the landing it would also claim paragraphs belonging to
 * the page chrome, the live preview shell, or a second theme rendered
 * alongside. Opting elements in explicitly keeps the effect inside the theme.
 *
 * The observer disconnects after the first intersection — these animations play
 * once, and leaving observers attached to every block of a long invitation is
 * pure overhead.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Staggers siblings; the source cycled 0/70/140/210ms. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Starts visible so the server-rendered HTML is readable on its own: if
  // hydration never happens, the content is shown rather than stuck at
  // `opacity:0`. The effect hides it again before the browser paints.
  const [revealed, setRevealed] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    setRevealed(false);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={["reveal-item", revealed ? "is-visible" : "", className].filter(Boolean).join(" ")}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

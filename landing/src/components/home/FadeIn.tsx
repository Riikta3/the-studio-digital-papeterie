"use client";

import { useEffect, useRef, useState } from "react";

// Shared scroll-reveal used across the home sections: fade + slide-up
// when the element enters the viewport, once.
//
// Deliberately NOT framer-motion. Two reasons:
//   1. It was the only thing making framer-motion a dependency of every
//      section, which put the whole animation bundle on the critical path.
//   2. `initial={{ opacity: 0 }}` is serialised into the SSR HTML, so 36
//      wrappers shipped invisible and nothing painted until hydration ran —
//      a 2.2s gap between First Contentful Paint and Speed Index.
//
// Here the server markup is visible by default and the reveal is layered on
// only once JS is running (`html.js-ready`, set by an inline script in the
// locale layout). If JS is slow, blocked or broken, the content is simply
// there — the failure mode is "no animation", not "no page".
export function FadeIn({
  children,
  className,
  style,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  // Accepted for backwards compatibility with the 21 existing call sites and
  // ignored: the observer below uses rootMargin rather than a ratio
  // threshold, so tall blocks no longer need a lowered value to trigger.
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    // `rootMargin`, NOT a ratio threshold. A block taller than the viewport
    // can never reach a 0.4 intersection ratio, which is exactly how the
    // ~840px dashboard section once ended up stuck at opacity 0 (see the
    // comment in Dashboard.tsx). Firing as soon as any part crosses 10% up
    // from the bottom edge behaves the same for normal blocks and, unlike a
    // threshold, cannot deadlock on a tall one.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={shown ? "in" : "out"}
      className={className}
      style={{
        ...style,
        transitionDelay: delay ? `${delay}s` : undefined,
      }}
    >
      {children}
    </div>
  );
}

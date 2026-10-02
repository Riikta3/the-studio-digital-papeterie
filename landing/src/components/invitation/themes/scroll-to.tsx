"use client";

import { type ReactNode, useRef } from "react";

/**
 * A button that scrolls to a section of the theme.
 *
 * Not an `<a href="#…">`: a hash link scrolls again on every refresh (the
 * repo's convention is `scrollIntoView` from a client component). `target` is a
 * CSS selector looked up inside the theme's own root — several themes and the
 * landing around them can be on the page at once in the editor's preview, and
 * element ids are document-global — or `"top"` for the top of the page.
 * Reduced motion gets an instant jump.
 */
export function ScrollToButton({
  target,
  className,
  ariaLabel,
  children,
}: {
  target: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  function go() {
    const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    if (target === "top") {
      window.scrollTo({ top: 0, behavior });
      return;
    }

    const scope: ParentNode = ref.current?.closest("[data-theme-root]") ?? document;
    scope.querySelector(target)?.scrollIntoView({ behavior, block: "start" });
  }

  return (
    <button ref={ref} type="button" className={className} aria-label={ariaLabel} onClick={go}>
      {children}
    </button>
  );
}

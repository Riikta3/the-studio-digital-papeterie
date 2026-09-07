"use client";

import { useEffect } from "react";

// The homepage's sections mount progressively, so the target of a hash may not
// exist on the first frame. Poll briefly rather than scrolling once and missing.
const POLL_INTERVAL_MS = 50;
const MAX_WAIT_MS = 3000;

/**
 * Scrolls to the section named in `location.hash` after the page has rendered.
 *
 * Needed because arriving at `/#tarifs` from another route is a client-side
 * navigation: the browser resolves a hash against the document it already has,
 * which at that moment is still the previous page, so it never scrolls.
 *
 * `behavior: "instant"`, deliberately. `globals.css` sets `scroll-behavior:
 * smooth` on <html>, and a smooth scroll to a section 6000px down races the
 * homepage's own mount: sections settling above the target keep changing the
 * document height, which cancels the in-flight scroll animation and leaves the
 * reader at the top. An instant jump cannot be interrupted — and there is
 * nothing to animate past on a page the reader is arriving at for the first
 * time anyway. Links *within* the homepage still scroll smoothly.
 *
 * Deliberately does not listen for later hash changes.
 */
export function useScrollToHash() {
  useEffect(() => {
    const anchor = window.location.hash.slice(1);
    if (!anchor) return;

    let timer: ReturnType<typeof setTimeout>;
    const deadline = Date.now() + MAX_WAIT_MS;

    const attempt = () => {
      const target = document.getElementById(anchor);
      if (target) {
        target.scrollIntoView({ behavior: "instant" });
        return;
      }
      if (Date.now() < deadline) timer = setTimeout(attempt, POLL_INTERVAL_MS);
    };

    attempt();
    return () => clearTimeout(timer);
  }, []);
}

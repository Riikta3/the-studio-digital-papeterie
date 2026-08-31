"use client";

import { useEffect, useRef, useState } from "react";

/**
 * "Retour en haut" — the floating button that appears once the hero is behind
 * you.
 *
 * Visibility is driven by an `IntersectionObserver` on `.hero-direct`, not by a
 * pixel threshold. The hero is `height:100svh;min-height:720px`, so any hard
 * number would be wrong on some screen: too early on a tall desktop, too late
 * on a short phone in landscape. Watching the element itself is correct at
 * every size for free.
 *
 * The button stays mounted and is hidden with `inert` + `visibility` (see
 * `responsive.css`) rather than being removed from the DOM: unmounting would
 * cut the fade-out, and `inert` is what keeps it off the tab order while it is
 * invisible — `opacity:0` alone leaves a focusable target floating over the
 * page.
 */
export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Scoped to this theme's root, not the document: several themes and the
    // landing around them can be on the page at once in the live preview.
    const root = ref.current?.closest(".theme-ciao-amore");
    const hero = root?.querySelector(".hero-direct");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      // Any sliver of hero still on screen counts as "in the hero".
      { threshold: 0 },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduced) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // `behavior:"auto"` is NOT enough on its own here. The scrolling element is
    // <html>, which carries `scroll-behavior:smooth` from a stylesheet outside
    // this theme, and CSS wins: the spec only honours the `behavior` option
    // when the computed style is `auto`, so the jump animated anyway under
    // reduced motion. The theme's own reduced-motion reset is scoped to
    // `.theme-ciao-amore` and cannot reach <html>.
    //
    // So the inherited value is suspended for exactly this one scroll and put
    // back immediately — cheaper and far less invasive than an `!important`
    // rule on <html> from a theme that must not style outside itself.
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top: 0, behavior: "auto" });
    root.style.scrollBehavior = previous;
  };

  return (
    <button
      ref={ref}
      type="button"
      className="ca-scrolltop"
      onClick={toTop}
      aria-label="Retour en haut de la page"
      aria-hidden={!visible}
      // `inert` reflects to the attribute in every browser that ships it, and
      // React 19 types it. Closed panels elsewhere in this theme use it for the
      // same reason: it removes the subtree from the tab order *and* from the
      // accessibility tree without killing the transition.
      inert={!visible}
      data-visible={visible ? "true" : "false"}
    >
      {/* Drawn inline like every other icon in this theme (the loupe, the cup,
          the church): no asset request for 24 pixels of arrow. */}
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 19V5M12 5l-6 6M12 5l6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

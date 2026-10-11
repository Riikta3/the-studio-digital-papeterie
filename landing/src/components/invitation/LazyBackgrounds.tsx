"use client";

import { useEffect } from "react";

import "./lazy-backgrounds.css";

/** How far ahead of the screen a section's backgrounds start loading. */
const AHEAD = "100% 0px";

/**
 * Marks each invitation section `data-bg-ready` once it comes within a screen
 * of the viewport, which lets `lazy-backgrounds.css` give it its backgrounds
 * back. Once ready, a section stays ready.
 *
 * Sections are found by `data-editor-section`, which every theme puts on each
 * one. New ones are picked up as they appear: the editor preview redraws the
 * invitation as the couple types, and a module switched on adds a section.
 */
export function LazyBackgrounds() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-bg-ready", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: AHEAD },
    );

    let frame = 0;
    const scan = () => {
      frame = 0;
      for (const section of document.querySelectorAll("[data-editor-section]:not([data-bg-ready])")) {
        observer.observe(section);
      }
    };
    scan();

    const mutations = new MutationObserver(() => {
      if (!frame) frame = window.requestAnimationFrame(scan);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}

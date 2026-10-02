"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/**
 * The wedding cake that is nibbled in three states, drawn as three stacked
 * images whose opacity the stylesheet steps through while `.playing`. It plays
 * only while it is on screen, and not at all for a reader who asked for no
 * motion (then it stays whole).
 *
 * The cake is decoration that belongs to the theme (it is the menu card's
 * signature): it appears whatever the couple's menu says.
 */
export function CakeScene() {
  const t = useTranslations("Invitation.chateauRoyal.menu");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => scene.classList.toggle("playing", entry.isIntersecting && !reduced));
      },
      { threshold: 0.35 },
    );
    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  /* eslint-disable @next/next/no-img-element -- decorative frames, positioned and faded by CSS. */
  return (
    <div className="cake-scene" role="img" aria-label={t("cakeLabel")} ref={ref}>
      <img className="cake-frame cake-whole" src="/themes/chateau-royal/piece-montee.webp" alt="" loading="lazy" />
      <img
        className="cake-frame cake-first"
        src="/themes/chateau-royal/piece-montee-premiere-bouchee.webp"
        alt=""
        loading="lazy"
      />
      <img
        className="cake-frame cake-last"
        src="/themes/chateau-royal/piece-montee-trois-bouchees.webp"
        alt=""
        loading="lazy"
      />
    </div>
  );
  /* eslint-enable @next/next/no-img-element */
}

"use client";

import { Menu } from "lucide-react";
import Image from "next/image";

import { useHeaderReveal } from "@/lib/use-header-reveal";

// Floating pill header for the homepage: two capsules pinned to the top
// corners (logo left, burger right) that hide on scroll-down and come back on
// scroll-up — the pattern where the nav gets out of the way while reading but
// is one small upward flick away.
//
// It is a SEPARATE element from the hero's own inline <nav>, not a replacement
// for it. The inline nav is part of the hero composition (it sits on the
// violet backdrop, above the eyebrow) and ships in the SSR HTML; this one is
// `fixed`, starts hidden, and only ever appears once the visitor has left the
// hero behind. Trying to make one element do both jobs means either a
// layout-shifting nav or a hero missing its top row on first paint.

// Distance the visitor must have scrolled past before the pill is eligible to
// appear at all. Roughly the height of the hero's own nav row plus its top
// padding: below this the inline nav is still on screen and a second copy of
// the logo would just be a duplicate.
const REVEAL_AFTER = 240;

export function StickyHeader({
  onOpenMenu,
  menuAriaLabel,
}: {
  onOpenMenu: () => void;
  menuAriaLabel: string;
}) {
  const visible = useHeaderReveal(REVEAL_AFTER);

  return (
    <div
      // `inert` while hidden, not just transparent: a translated-away pill is
      // still in the tab order and screen readers still announce it, so the
      // first Tab on a freshly loaded page used to land on an invisible menu
      // button.
      inert={!visible ? true : undefined}
      aria-hidden={!visible}
      // z-30 threads between two neighbours: above the hero carousel's arrow
      // buttons (z-20), which sit at the same top offset on wide screens and
      // otherwise punch through the pills, but BELOW MobileMenu's scrim (z-40)
      // and panel (z-50) — at z-50 the pills floated on top of the open
      // drawer, which read as a header stuck over the menu.
      // The row itself never moves — only its opacity changes, and the two
      // pills slide. Animating `transform` on this container shifted the
      // buttons while they were fading in, so a click landing during the
      // 200ms reveal hit whatever the pill had just moved off of and the menu
      // silently failed to open. A stationary hit target is the whole point.
      className={`fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-3 transition-opacity duration-200 ease-out md:px-6 md:pt-4 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className={`flex h-12 items-center rounded-full bg-studio-violet px-4 shadow-studio-card transition-transform duration-200 ease-out ${
          visible ? "translate-y-0" : "-translate-y-3"
        }`}
      >
        <Image
          src="/logo.svg"
          alt="The Studio Digital Papeterie"
          width={28}
          height={30}
          // width+height are the intrinsic ratio; `h-auto` alongside `w-auto`
          // keeps next/image from warning about a one-sided CSS override.
          className="h-[30px] w-auto"
          style={{ height: 30, width: "auto" }}
        />
      </div>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={menuAriaLabel}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-studio-card transition-transform duration-200 ease-out hover:scale-105 active:scale-95 ${
          visible ? "translate-y-0" : "-translate-y-3"
        }`}
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}

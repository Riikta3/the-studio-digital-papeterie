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
      // z-50, above the hero carousel's arrow buttons: those sit at the same
      // top offset on wide screens, so at a lower z-index the arrows punched
      // through the pills.
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 pt-3 transition-[transform,opacity] duration-300 ease-out md:px-6 md:pt-4 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-4 opacity-0"
      }`}
    >
      <div className="flex h-12 items-center rounded-full bg-studio-violet px-4 shadow-studio-card">
        <Image
          src="/logo.svg"
          alt="The Studio Digital Papeterie"
          width={28}
          height={30}
          className="h-[30px] w-auto"
        />
      </div>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={menuAriaLabel}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet shadow-studio-card transition-transform hover:scale-105 active:scale-95"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
}

"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

import { Link } from "@/navigation";

// Same lazy-mount pattern as Hero.tsx: the drawer never opens during a
// page-load trace, so it is not worth pulling into this page's eager entry
// graph. Named export, hence the explicit .then().
const MobileMenu = dynamic(
  () => import("@/components/home/MobileMenu").then((m) => m.MobileMenu),
  { ssr: false },
);

/**
 * The logo + burger row for pages outside the homepage.
 *
 * `StickyHeader`/the inline nav in Hero.tsx are not reusable as-is: they are
 * wired into the homepage's own scroll and carousel state (violet backdrop
 * height, theme selection) and only make sense sitting on top of the hero.
 * This is the minimal reusable slice: the same logo, the same burger button
 * opening the same MobileMenu component, styled identically to the one in
 * Hero.tsx's own inline <nav>, without any of the homepage-only scroll
 * machinery.
 *
 * Mounted on every indexable page outside the homepage — contact, themes,
 * journal (index and articles) and the (landing) slugs. Those shipped with no
 * header at all, which left a visitor arriving from search with no way back
 * to the homepage and no way into the menu: the logo is the affordance every
 * site puts there, and it was the one thing missing.
 *
 * The colours assume a light ground: every page mounting this uses
 * `bg-studio-creme` or `bg-studio-beurre`. On a dark section it would need the
 * hero's inverted pairing instead.
 */
export function PageHeader() {
  const t = useTranslations("Hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);

  return (
    <>
      {/* `mx-auto` matters here: the hero's identical nav is centred by its
          parent (`flex flex-col items-center`), but this one sits directly in
          a plain <main>, so `max-w-6xl` alone left it pinned to the left and
          dropped all the slack to the right of the burger. Centring the nav
          itself keeps the component correct wherever it is mounted. */}
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-12">
        <Link href="/">
          {/* logo-violet, NOT logo.svg: the yellow mark is drawn for the
              hero's violet backdrop and all but vanishes on this page's
              yellow ground. Same asset the studio funnel uses on light
              backgrounds. */}
          <Image
            src="/logo-violet.svg"
            alt="The Studio Digital Papeterie"
            width={40}
            height={42}
            className="h-[42px] w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => {
            setMenuMounted(true);
            setMenuOpen(true);
          }}
          aria-label={t("menuAriaLabel")}
          // Inverted relative to the hero's burger: there the button is yellow
          // on violet, here the page ground IS yellow, so a yellow pill on it
          // has no edge at all. Violet on yellow is the same pairing the
          // studio funnel's buttons use on light pages.
          className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-violet text-studio-jaune transition-transform hover:scale-105 active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>
      </nav>

      {menuMounted && (
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}

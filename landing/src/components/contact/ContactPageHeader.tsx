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
 * Every other indexable page (themes, journal, legal) ships with no header
 * at all today, but the owner brief for Contact explicitly asks to "add
 * Contact to the main navigation" — which requires a way to actually reach
 * the rest of the site (and the menu that now lists Contact) from this page.
 * This is the minimal reusable slice: the same logo, the same burger button
 * opening the same MobileMenu component, styled identically to the one in
 * Hero.tsx's own inline <nav>, without any of the homepage-only scroll
 * machinery.
 */
export function ContactPageHeader() {
  const t = useTranslations("Hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);

  return (
    <>
      <nav className="flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-12">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="The Studio Digital Papeterie"
            width={40}
            height={42}
          />
        </Link>
        <button
          type="button"
          onClick={() => {
            setMenuMounted(true);
            setMenuOpen(true);
          }}
          aria-label={t("menuAriaLabel")}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-studio-jaune text-studio-violet"
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

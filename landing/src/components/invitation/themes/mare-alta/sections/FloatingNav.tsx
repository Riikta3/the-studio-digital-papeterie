"use client";

import { CalendarDays, Heart, MapPin, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { ScrollToButton } from "../../scroll-to";

type NavItem = { key: "venue" | "programme" | "rsvp"; target: string; Icon: LucideIcon };

/** The designer's three shortcuts, in their order: the place, the day, the reply. */
const ITEMS: readonly NavItem[] = [
  { key: "venue", target: "#ma-map", Icon: MapPin },
  { key: "programme", target: "#ma-timeline", Icon: CalendarDays },
  { key: "rsvp", target: "#ma-rsvp", Icon: Heart },
];

/**
 * The pill of shortcuts that floats at the bottom of the screen.
 *
 * The designer's fourth button played their audio; the invitation's own music
 * button (top right, the product's) does that here, so only the three
 * shortcuts are drawn. `targets` are the sections the wedding bought. A section
 * that renders nothing for lack of data (a programme with no moment) has its
 * button hidden once the page is mounted, so no button leads nowhere; the pill
 * itself goes when none is left.
 */
export function FloatingNav({ targets }: { targets: readonly string[] }) {
  const t = useTranslations("Invitation.mareAlta.nav");
  const nav = useRef<HTMLElement>(null);

  const items = ITEMS.filter((item) => targets.includes(item.target));
  const hasItems = items.length > 0;

  // After every render of the page (the editor's preview adds and removes sections as the couple
  // types): look in the theme's own root for each section and show the matching button or not.
  // The DOM is updated directly, which keeps React out of a render-then-correct loop.
  useEffect(() => {
    const aside = nav.current;
    const root = aside?.closest("[data-theme-root]");
    if (!aside || !root) return;

    let shown = 0;
    items.forEach((item, index) => {
      const button = aside.children[index] as HTMLElement | undefined;
      const present = Boolean(root.querySelector(item.target));
      if (button) button.style.display = present ? "" : "none";
      if (present) shown += 1;
    });
    aside.style.display = shown > 0 ? "" : "none";
  });

  // The pill and the hero's "Discover" cue both sit at the bottom centre of the screen: on the first screen of every
  // device the pill covered the cue. It stays away (`data-away`, `responsive.css`) while the cue is in the bottom
  // fifth of the screen, where the pill is, and comes in as soon as the guest scrolls it clear. It is rendered away
  // so it does not flash in and out on load; a page with no cue, or no IntersectionObserver, simply shows it.
  useEffect(() => {
    const aside = nav.current;
    const cue = aside?.closest("[data-theme-root]")?.querySelector(".hero .scroll-cue");
    if (!aside) return;
    if (!cue || !("IntersectionObserver" in window)) {
      aside.removeAttribute("data-away");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => aside.toggleAttribute("data-away", entry.isIntersecting),
      // The document as root: inside the home page's phone mock-up (an iframe) the band is the mock-up's screen.
      { root: document, rootMargin: "-80% 0px 0px 0px" },
    );
    observer.observe(cue);
    return () => observer.disconnect();
    // Re-run when the pill itself appears (the editor's preview can add its first section after mount).
  }, [hasItems]);

  if (!hasItems) return null;

  return (
    <aside ref={nav} className="floating-nav" aria-label={t("label")} data-away="">
      {items.map(({ key, target, Icon }) => (
        <ScrollToButton key={key} target={target} ariaLabel={t(key)}>
          <Icon size={17} aria-hidden="true" />
        </ScrollToButton>
      ))}
    </aside>
  );
}

/**
 * The dashboard's six sections, per §23 of the brief.
 *
 * Two pages that already work — /guests and the seating plan — were reachable
 * from no link at all before this. Adding them here is most of the point.
 */

import {
  BarChart3,
  CalendarHeart,
  Home,
  PartyPopper,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItemDef = {
  /** i18n key under `Sidebar.sections.<section>.items` */
  key: string;
  href: string;
  /**
   * A checkout extra (`sites.extras`) the site must own for the item to be
   * listed — a screen for an option the couple did not buy is a door to
   * nothing.
   */
  requiresExtra?: string;
};

export type NavSectionDef = {
  /** i18n key under `Sidebar.sections` */
  key: string;
  icon: LucideIcon;
  /** A section with a single item links straight to it, with no accordion. */
  href?: string;
  items?: NavItemDef[];
};

export const NAV_SECTIONS: NavSectionDef[] = [
  { key: "home", icon: Home, href: "/" },
  {
    key: "guests",
    icon: Users,
    items: [
      { key: "all", href: "/guests" },
      { key: "rsvp", href: "/rsvp-responses" },
      { key: "groups", href: "/guests/groupes" },
      { key: "meals", href: "/guests/repas" },
    ],
  },
  {
    key: "invitation",
    icon: CalendarHeart,
    // One editor for every word of the invitation (`/invitation`), which
    // replaced the five screens that used to sit here — "Nos mots",
    // événements, programme, lieu, FAQ. The catalogue stays, to buy a module,
    // and the playlist stays because it moderates what guests send, which is
    // not editing the invitation.
    items: [
      { key: "editor", href: "/invitation" },
      { key: "modules", href: "/modules" },
      { key: "playlist", href: "/playlist" },
      { key: "music", href: "/musique", requiresExtra: "custom-music" },
    ],
  },
  {
    key: "day_of",
    icon: PartyPopper,
    items: [
      { key: "seating", href: "/jour-j/plan-de-table" },
      { key: "qr_code", href: "/jour-j/qr-code" },
      { key: "menu", href: "/jour-j/menu" },
      { key: "photos", href: "/jour-j/photos" },
      { key: "settings", href: "/jour-j/parametres" },
    ],
  },
  { key: "stats", icon: BarChart3, href: "/stats" },
  {
    key: "settings",
    icon: Settings,
    items: [
      { key: "couple", href: "/settings" },
      { key: "billing", href: "/billing" },
      { key: "messages", href: "/messages" },
    ],
  },
];

/** True when `pathname` is inside the section — drives the open accordion. */
export function isSectionActive(
  section: NavSectionDef,
  pathname: string,
): boolean {
  if (section.href) return pathname === section.href;
  return (section.items ?? []).some((item) => pathname.startsWith(item.href));
}

/**
 * The nav item a pathname belongs to, or undefined.
 *
 * Longest match wins: `/guests` is a prefix of `/guests/groupes`, so a naive
 * `startsWith` lights up both. Prefix matching (rather than equality) is still
 * what we want, so a nested page keeps its parent item highlighted.
 */
export function activeItemHref(
  section: NavSectionDef,
  pathname: string,
): string | undefined {
  return (section.items ?? [])
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/**
 * The sections as this site sees them: items tied to an extra it did not buy
 * are left out. `extras` is null while the site is still being read, which
 * lists none of them rather than flashing one that then disappears.
 */
export function visibleNavSections(
  sections: NavSectionDef[],
  extras: readonly string[] | null,
): NavSectionDef[] {
  return sections.map((section) =>
    section.items
      ? {
          ...section,
          items: section.items.filter(
            (item) => !item.requiresExtra || (extras ?? []).includes(item.requiresExtra),
          ),
        }
      : section,
  );
}

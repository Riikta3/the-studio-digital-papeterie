import type { EditorSectionId } from "@shared/data/invitation-sections";
import {
  BedDouble,
  BookHeart,
  Bus,
  CalendarDays,
  CircleHelp,
  Clapperboard,
  Gift,
  Images,
  type LucideIcon,
  MailCheck,
  MapPin,
  Music,
  PenLine,
  Shirt,
  Sparkles,
  Timer,
  UtensilsCrossed,
  Video,
} from "lucide-react";

import type { EditorUnit } from "../types";

/**
 * What each tab of the editor is, besides its form: the icon on the tab, and
 * the parts of the invitation its form writes — used to put a red dot on the
 * tab whose save failed.
 *
 * `texts` is shared by nearly every tab (each has theme slots), so it is only
 * listed where the tab writes contract copy too; a failed `texts` save is shown
 * on the tabs that were edited.
 */
export const SECTION_META: Record<EditorSectionId, { icon: LucideIcon; units: EditorUnit[] }> = {
  hero: { icon: Sparkles, units: ["names", "settings", "texts", "events", "venue"] },
  countdown: { icon: Timer, units: ["events", "texts"] },
  "intro-video": { icon: Clapperboard, units: ["modules.intro-video"] },
  timeline: { icon: CalendarDays, units: ["events", "schedule", "texts"] },
  "dress-code": { icon: Shirt, units: ["modules.dress-code"] },
  rsvp: { icon: MailCheck, units: ["modules.rsvp", "settings", "texts"] },
  map: { icon: MapPin, units: ["venue", "modules.map"] },
  accommodation: { icon: BedDouble, units: ["accommodations", "modules.accommodation"] },
  transport: { icon: Bus, units: ["modules.transport"] },
  menu: { icon: UtensilsCrossed, units: ["modules.menu"] },
  gallery: { icon: Images, units: ["modules.gallery"] },
  "gift-list": { icon: Gift, units: ["modules.gift-list"] },
  playlist: { icon: Music, units: ["modules.playlist"] },
  guestbook: { icon: BookHeart, units: ["modules.guestbook"] },
  "video-guestbook": { icon: Video, units: ["modules.video-guestbook"] },
  faq: { icon: CircleHelp, units: ["faq", "modules.faq"] },
  footer: { icon: PenLine, units: ["settings", "texts"] },
};

/** The error messages that concern a tab, from a save's per-unit errors. */
export function sectionErrors(
  section: EditorSectionId,
  errors: Partial<Record<EditorUnit, string>>,
  edited: boolean,
): string[] {
  const units = new Set<EditorUnit>(SECTION_META[section].units);
  if (edited) units.add("texts");

  return Object.entries(errors)
    .filter(([unit]) => units.has(unit as EditorUnit))
    .map(([, message]) => message as string);
}

import {
  Bus,
  Calendar,
  Camera,
  Gift,
  Globe,
  Heart,
  Info,
  MapPin,
  MessageSquare,
  Music,
  Timer,
  Users,
  Utensils,
  Video,
} from "lucide-react";

// name/description are translated via the "Modules.catalog.<id>" namespace
// (see dashboard/messages/*.json and landing/messages/*.json) — this array
// only holds the stable identifiers, icons and ordering used by server
// actions and React keys.
export const APP_MODULES = [
  { id: "countdown", icon: Timer, defaultOrder: 1 },
  { id: "intro-video", icon: Video, defaultOrder: 2 },
  { id: "timeline", icon: Calendar, defaultOrder: 3 },
  { id: "dress-code", icon: Heart, defaultOrder: 4 },
  { id: "rsvp", icon: Users, defaultOrder: 5 },
  { id: "map", icon: MapPin, defaultOrder: 6 },
  { id: "accommodation", icon: Globe, defaultOrder: 7 },
  { id: "transport", icon: Bus, defaultOrder: 8 },
  { id: "menu", icon: Utensils, defaultOrder: 9 },
  { id: "gallery", icon: Camera, defaultOrder: 10 },
  { id: "gift-list", icon: Gift, defaultOrder: 11 },
  { id: "playlist", icon: Music, defaultOrder: 12 },
  { id: "guestbook", icon: MessageSquare, defaultOrder: 13 },
  { id: "video-guestbook", icon: MessageSquare, defaultOrder: 14 },
  { id: "faq", icon: Info, defaultOrder: 15 },
];

type ModuleTranslator = (key: string) => string;

export function getModuleName(t: ModuleTranslator, id: string): string {
  return t(`catalog.${id}.name`);
}

export function getModuleDescription(t: ModuleTranslator, id: string): string {
  return t(`catalog.${id}.description`);
}

export function getModulesWithLabels(t: ModuleTranslator) {
  return APP_MODULES.map((m) => ({
    ...m,
    name: getModuleName(t, m.id),
    description: getModuleDescription(t, m.id),
  }));
}

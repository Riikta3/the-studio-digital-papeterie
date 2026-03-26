import type React from "react";

export interface ModuleProps {
  weddingId: string;
  weddingDate?: string | null;
  extras?: Record<string, any> | null;
  config?: Record<string, any> | null;
  partner1?: string;
  partner2?: string;
  isDemo?: boolean;
}

export type ThemeModuleRegistry = Record<
  string,
  Record<string, React.ComponentType<ModuleProps>>
>;

import * as Minimalist from "./themes/theme-minimalist";
import * as Floral from "./themes/theme-floral";
import * as Boho from "./themes/theme-boho";
import * as Royal from "./themes/theme-royal";
import * as Modern from "./themes/theme-modern";

const buildMap = (theme: any): Record<string, React.ComponentType<ModuleProps>> => ({
  countdown: theme.CountdownModule,
  rsvp: theme.RsvpModule,
  gallery: theme.GalleryModule,
  map: theme.MapModule,
  timeline: theme.TimelineModule,
  "dress-code": theme.DressCodeModule,
  "gift-list": theme.GiftListModule,
  guestbook: theme.GuestbookModule,
  accommodation: theme.AccommodationModule,
  transport: theme.TransportModule,
  menu: theme.MenuModule,
  playlist: theme.PlaylistModule,
  faq: theme.FaqModule,
  "intro-video": theme.IntroVideoModule,
  "video-guestbook": theme.VideoGuestbookModule,
});

export const THEME_MODULE_COMPONENTS: ThemeModuleRegistry = {
  "theme-minimalist": buildMap(Minimalist),
  "theme-floral": buildMap(Floral),
  "theme-boho": buildMap(Boho),
  "theme-royal": buildMap(Royal),
  "theme-modern": buildMap(Modern),
};

export const DEFAULT_THEME = "theme-minimalist";

export function getModuleComponent(
  themeId: string,
  moduleId: string
): React.ComponentType<ModuleProps> | null {
  const themeMap =
    THEME_MODULE_COMPONENTS[themeId] ??
    THEME_MODULE_COMPONENTS[DEFAULT_THEME];
  return themeMap?.[moduleId] ?? null;
}

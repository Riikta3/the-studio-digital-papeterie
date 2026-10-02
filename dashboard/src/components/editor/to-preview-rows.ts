import { normaliseUserUrl } from "@shared/lib/safe-url";
import type { InvitationRows } from "@shared/types/invitation-rows";

import { previewModules } from "./module-status";
import type { EditorMeta, EditorState, ModuleConfig } from "./types";

/**
 * A link as the save will store it: "www.domaine.fr" becomes
 * "https://www.domaine.fr" (`validate.ts`, `link`). The preview's links go
 * through the same `safeUrl` as the public page, so without this every link
 * typed without its scheme vanished from the preview until the couple saved.
 * A value that is no link at all is passed on as typed, for `safeUrl` to drop.
 */
function asSaved(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return normaliseUserUrl(trimmed) ?? trimmed;
}

/**
 * The module config keys `validate.ts` stores as links, module by module.
 * `editor.test.mjs` checks this against what the save actually does.
 */
export const MODULE_LINK_KEYS: Readonly<Record<string, readonly string[]>> = {
  "dress-code": ["imageUrl"],
  "intro-video": ["videoUrl"],
  "gift-list": ["gift_list_url"],
  transport: ["carpoolUrl"],
};

/** A module's config with its links as the save will store them. */
function previewConfig(moduleId: string, config: ModuleConfig): ModuleConfig {
  const next: ModuleConfig = { ...config };
  for (const key of MODULE_LINK_KEYS[moduleId] ?? []) {
    const value = config[key];
    if (typeof value === "string") next[key] = asSaved(value) ?? "";
  }
  if (moduleId === "gallery" && Array.isArray(config.images)) {
    next.images = config.images.map((image) => (typeof image === "string" ? asSaved(image) ?? "" : image));
  }
  return next;
}

/**
 * The couple's draft — including modules added but not yet paid — as the rows
 * the public invitation would read once it is
 * saved — the message the editor posts to its live preview.
 *
 * It reproduces what the public route's queries return, and nothing more:
 * disabled events and unpublished questions are left out (the database's
 * public readers leave them out), and so are the blank rows the forms keep
 * open to type into (the save drops them). What the preview draws from this is
 * therefore what guests will see after "Enregistrer".
 */
export function toPreviewRows(state: EditorState, meta: EditorMeta): InvitationRows {
  const or = (value: string) => (value.trim() ? value : null);
  const modules = previewModules(state, meta);

  const events = state.events.filter((event) => event.enabled);
  const shown = new Set(events.map((event) => event.id));

  // Positions restart at 1 inside each event, as `schedule_entries.position` does.
  const nextPosition = new Map<string, number>();
  const schedule = state.schedule
    .filter((entry) => shown.has(entry.eventId) && (entry.title.trim() || entry.time.trim()))
    .map((entry) => {
      const position = (nextPosition.get(entry.eventId) ?? 0) + 1;
      nextPosition.set(entry.eventId, position);
      return {
        id: entry.id,
        event_id: entry.eventId,
        time: entry.time,
        title: entry.title,
        description: or(entry.description),
        position,
        icon: entry.icon || null,
        image_url: asSaved(entry.imageUrl),
      };
    });

  const { venue } = state;
  const hasVenue = Object.values(venue).some((field) => field.trim());

  return {
    site: {
      theme_id: meta.themeId,
      modules,
      adults_only: state.settings.adultsOnly,
      languages: meta.languages,
      hero_kicker: or(state.settings.heroKicker),
      announcement: or(state.settings.announcement),
      closing_words: or(state.settings.closingWords),
      couple_photo_url: asSaved(state.settings.couplePhotoUrl),
      invitation_texts: state.texts,
    },
    names: { first_name: state.names.partner1, partner_name: state.names.partner2 },
    events: events.map((event, index) => ({
      id: event.id,
      key: event.key,
      name: event.name,
      date: or(event.date),
      time: or(event.time),
      address: or(event.address),
      description: or(event.description),
      dress_code: or(event.dressCode),
      position: index + 1,
    })),
    schedule,
    venue: hasVenue
      ? {
          name: venue.name,
          address: or(venue.address),
          city: or(venue.city),
          maps_url: asSaved(venue.mapsUrl),
          waze_url: asSaved(venue.wazeUrl),
          parking_info: or(venue.parkingInfo),
          access_info: or(venue.accessInfo),
          transport_info: or(venue.transportInfo),
          photo_url: asSaved(venue.photoUrl),
        }
      : null,
    accommodations: state.accommodations
      .filter((stay) => stay.name.trim())
      .map((stay) => ({
        id: stay.id,
        name: stay.name,
        city: or(stay.city),
        distance: or(stay.distance),
        phone: or(stay.phone),
        booking_url: asSaved(stay.bookingUrl),
        offer: or(stay.offer),
        photo_url: asSaved(stay.photoUrl),
        address: or(stay.address),
        secondary: stay.secondary,
      })),
    faq: state.faq
      .filter((entry) => entry.published && entry.question.trim() && entry.answer.trim())
      .map((entry, index) => ({
        id: entry.id,
        question: entry.question,
        answer: entry.answer,
        position: index + 1,
      })),
    moduleConfigs: modules.map((moduleId, index) => ({
      module_id: moduleId,
      position: index + 1,
      config: previewConfig(moduleId, state.modules[moduleId] ?? {}),
    })),
  };
}

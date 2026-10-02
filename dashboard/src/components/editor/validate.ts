import { normaliseTexts } from "@shared/data/invitation-texts";
import { SCHEDULE_ICON_KEYS, type ScheduleIconKey } from "@shared/data/schedule-icons";
import { normaliseUserUrl } from "@shared/lib/safe-url";
import { EVENT_KEYS, type EventKey } from "@shared/types/invitation";

import type {
  EditorAccommodation,
  EditorEvent,
  EditorFaqEntry,
  EditorScheduleEntry,
  EditorState,
  EditorVenue,
  ModuleConfig,
} from "./types";

/**
 * Server-side checks for everything the invitation editor saves.
 *
 * The forms enforce the same limits in the browser, but a server action is an
 * endpoint anyone signed in can call with any payload, so nothing here trusts
 * the shape it is given. Each function takes `unknown`, returns the cleaned
 * value, and throws `EditorValidationError` with a sentence the couple can act
 * on — it is shown on the tab that failed.
 *
 * Pure: no database, so it is tested directly (`editor.test.mjs`).
 */

export class EditorValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EditorValidationError";
  }
}

/* ------------------------------------------------------------------ *
 * Primitives
 * ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) throw new EditorValidationError(`${what} : données illisibles.`);
  return value;
}

/**
 * A trimmed string, `""` when absent. Longer than `max` is refused rather than
 * cut: the forms stop typing at `max`, so a longer value did not come from
 * them, and silently truncating a couple's sentence is worse than saying so.
 */
function text(value: unknown, max: number, label: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    throw new EditorValidationError(`« ${label} » doit être un texte.`);
  }
  const cleaned = value.replace(/\r\n?/g, "\n").trim();
  if (cleaned.length > max) {
    throw new EditorValidationError(`« ${label} » dépasse ${max} caractères.`);
  }
  return cleaned;
}

function required(value: unknown, max: number, label: string): string {
  const cleaned = text(value, max, label);
  if (!cleaned) throw new EditorValidationError(`« ${label} » ne peut pas être vide.`);
  return cleaned;
}

/** Empty stays empty; anything else must be (or become) a web link. */
function link(value: unknown, label: string): string {
  const raw = text(value, 2000, label);
  if (!raw) return "";
  const url = normaliseUserUrl(raw);
  if (!url) {
    throw new EditorValidationError(
      `Le lien « ${raw.slice(0, 60)} » (${label}) n'est pas une adresse web valide.`,
    );
  }
  return url;
}

function flag(value: unknown): boolean {
  return value === true;
}

/** `YYYY-MM-DD` naming a real day, or empty. */
function isoDay(value: unknown, label: string): string {
  const raw = text(value, 10, label);
  if (!raw) return "";

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const [year, month, day] = match ? match.slice(1).map(Number) : [];
  const date = match ? new Date(Date.UTC(year, month - 1, day)) : null;

  if (!date || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new EditorValidationError(`« ${label} » n'est pas une date valide.`);
  }
  return raw;
}

function list(value: unknown, max: number, label: string): unknown[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new EditorValidationError(`${label} : liste illisible.`);
  if (value.length > max) {
    throw new EditorValidationError(`${label} : ${max} éléments au maximum.`);
  }
  return value;
}

/** A row id: a uuid from the database, or one minted by the editor. */
function rowId(value: unknown): string {
  if (typeof value !== "string" || !/^[\w-]{1,80}$/.test(value)) {
    throw new EditorValidationError("Identifiant de ligne invalide.");
  }
  return value;
}

/**
 * The CSS colours a theme may print in a `style` attribute — the same
 * allowlist the landing applies when it reads them
 * (`landing/src/lib/module-config.ts`), so nothing saved here is dropped there.
 */
const CSS_COLOR = /^(#[0-9a-f]{3}|#[0-9a-f]{6}|(rgb|hsl)a?\([\d\s.,%/]+\))$/i;

const FRENCH_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** "1er avril 2027" — the RSVP label rows written before the ISO value carry. */
function frenchLongDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day === 1 ? "1er" : day} ${FRENCH_MONTHS[month - 1]} ${year}`;
}

/* ------------------------------------------------------------------ *
 * Units
 * ------------------------------------------------------------------ */

export function cleanNames(value: unknown): EditorState["names"] {
  const names = record(value, "Prénoms");
  return {
    partner1: required(names.partner1, 60, "Premier prénom"),
    partner2: required(names.partner2, 60, "Second prénom"),
  };
}

export function cleanSettings(value: unknown): EditorState["settings"] {
  const settings = record(value, "Textes");
  return {
    heroKicker: text(settings.heroKicker, 160, "Sur-titre"),
    announcement: text(settings.announcement, 600, "Annonce"),
    closingWords: text(settings.closingWords, 600, "Mot de la fin"),
    couplePhotoUrl: link(settings.couplePhotoUrl, "Photo du couple"),
    adultsOnly: flag(settings.adultsOnly),
  };
}

export function cleanTexts(value: unknown): Record<string, string> {
  return normaliseTexts(value);
}

const KNOWN_EVENT_KEYS: ReadonlySet<string> = new Set(EVENT_KEYS);

export function cleanEvents(value: unknown): EditorEvent[] {
  const seen = new Set<string>();

  return list(value, 8, "Événements").map((raw) => {
    const event = record(raw, "Événement");
    const key = event.key;

    if (typeof key !== "string" || !KNOWN_EVENT_KEYS.has(key)) {
      throw new EditorValidationError("Type d'événement inconnu.");
    }
    // One of each: the RSVP asks about events by kind, and two "brunch" rows
    // would be two identical questions to every guest.
    if (seen.has(key)) {
      throw new EditorValidationError("Chaque événement ne peut apparaître qu'une fois.");
    }
    seen.add(key);

    return {
      id: rowId(event.id),
      key: key as EventKey,
      name: required(event.name, 80, "Nom de l'événement"),
      date: isoDay(event.date, "Date de l'événement"),
      time: text(event.time, 20, "Heure de l'événement"),
      address: text(event.address, 300, "Adresse de l'événement"),
      description: text(event.description, 2000, "Description de l'événement"),
      dressCode: text(event.dressCode, 300, "Tenue de l'événement"),
      enabled: flag(event.enabled),
    };
  });
}

const KNOWN_ICONS: ReadonlySet<string> = new Set(SCHEDULE_ICON_KEYS);

/**
 * `eventIds` are the wedding's own events as they stand after the events were
 * saved: a moment may only hang off one of them, which is what stops a crafted
 * payload from attaching rows to someone else's event.
 */
export function cleanSchedule(value: unknown, eventIds: ReadonlySet<string>): EditorScheduleEntry[] {
  const entries: EditorScheduleEntry[] = [];

  for (const raw of list(value, 80, "Programme")) {
    const entry = record(raw, "Moment");
    const time = text(entry.time, 20, "Heure");
    const title = text(entry.title, 120, "Titre du moment");

    // The row the form keeps open to type into. Dropped, not refused.
    if (!time && !title) continue;
    if (!title) throw new EditorValidationError(`Le moment de ${time} n'a pas de titre.`);

    const eventId = typeof entry.eventId === "string" ? entry.eventId : "";
    if (!eventIds.has(eventId)) {
      throw new EditorValidationError(`Le moment « ${title} » n'est rattaché à aucun événement.`);
    }

    const icon = typeof entry.icon === "string" && KNOWN_ICONS.has(entry.icon)
      ? (entry.icon as ScheduleIconKey)
      : "";

    entries.push({
      id: rowId(entry.id),
      eventId,
      time,
      title,
      description: text(entry.description, 1000, "Description du moment"),
      icon,
      imageUrl: link(entry.imageUrl, "Photo du moment"),
    });
  }

  return entries;
}

export function cleanVenue(value: unknown): EditorVenue {
  const venue = record(value, "Lieu");
  return {
    name: text(venue.name, 160, "Nom du lieu"),
    address: text(venue.address, 400, "Adresse du lieu"),
    city: text(venue.city, 120, "Ville"),
    mapsUrl: link(venue.mapsUrl, "Google Maps"),
    wazeUrl: link(venue.wazeUrl, "Waze"),
    parkingInfo: text(venue.parkingInfo, 1500, "Stationnement"),
    accessInfo: text(venue.accessInfo, 1500, "Accès"),
    transportInfo: text(venue.transportInfo, 1500, "Transports"),
    photoUrl: link(venue.photoUrl, "Photo du lieu"),
  };
}

export function cleanAccommodations(value: unknown): EditorAccommodation[] {
  const stays: EditorAccommodation[] = [];

  for (const raw of list(value, 30, "Hébergements")) {
    const stay = record(raw, "Hébergement");
    const cleaned: EditorAccommodation = {
      id: rowId(stay.id),
      name: text(stay.name, 160, "Nom de l'hébergement"),
      city: text(stay.city, 120, "Ville de l'hébergement"),
      distance: text(stay.distance, 80, "Distance"),
      address: text(stay.address, 300, "Adresse de l'hébergement"),
      phone: text(stay.phone, 40, "Téléphone"),
      bookingUrl: link(stay.bookingUrl, "Lien de réservation"),
      offer: text(stay.offer, 500, "Offre"),
      photoUrl: link(stay.photoUrl, "Photo de l'hébergement"),
      secondary: flag(stay.secondary),
    };

    const { id: _id, secondary: _secondary, ...content } = cleaned;
    if (Object.values(content).every((field) => !field)) continue;
    if (!cleaned.name) {
      throw new EditorValidationError("Chaque hébergement doit avoir un nom.");
    }

    stays.push(cleaned);
  }

  return stays;
}

export function cleanFaq(value: unknown): EditorFaqEntry[] {
  const entries: EditorFaqEntry[] = [];

  for (const raw of list(value, 40, "FAQ")) {
    const entry = record(raw, "Question");
    const question = text(entry.question, 300, "Question");
    const answer = text(entry.answer, 3000, "Réponse");

    if (!question && !answer) continue;
    // Half an entry is worse than none on a page guests trust.
    if (!question || !answer) {
      throw new EditorValidationError("Chaque question doit avoir sa réponse (et inversement).");
    }

    entries.push({ id: rowId(entry.id), question, answer, published: flag(entry.published) });
  }

  return entries;
}

/* ------------------------------------------------------------------ *
 * Module configs
 * ------------------------------------------------------------------ */

function colors(value: unknown): string[] {
  return list(value, 6, "Palette").map((raw) => {
    const color = text(raw, 40, "Couleur");
    if (!CSS_COLOR.test(color)) {
      throw new EditorValidationError(`« ${color} » n'est pas une couleur.`);
    }
    return color;
  });
}

function strings(value: unknown, max: number, itemMax: number, label: string): string[] {
  return list(value, max, label)
    .map((raw) => text(raw, itemMax, label))
    .filter(Boolean);
}

const TRANSPORT_ICONS = new Set(["Train", "Plane", "Bus", "Car", "Ship"]);

/**
 * Only the keys the editor writes for this module, merged onto what the row
 * held before — so a key written by an older screen (the map module's own
 * venue name, say) survives a save it had nothing to do with.
 */
export function cleanModuleConfig(
  moduleId: string,
  value: unknown,
  previous: ModuleConfig,
): ModuleConfig {
  const config = record(value, "Module");
  let cleaned: ModuleConfig;

  switch (moduleId) {
    case "dress-code":
      cleaned = {
        title: text(config.title, 160, "Titre du dress code"),
        subtitle: text(config.subtitle, 160, "Titre du dress code"),
        mode: config.mode === "split" ? "split" : "global",
        description: text(config.description, 2000, "Consignes"),
        description_men: text(config.description_men, 2000, "Consignes (messieurs)"),
        description_women: text(config.description_women, 2000, "Consignes (mesdames)"),
        colors: colors(config.colors),
        imageUrl: link(config.imageUrl, "Photo d'inspiration"),
        note: text(config.note, 500, "Note"),
      };
      break;

    case "rsvp": {
      const iso = isoDay(config.rsvp_deadline_iso, "Date limite de réponse");
      cleaned = {
        rsvp_deadline_iso: iso,
        // Kept beside the ISO day for the screens that still print the label.
        rsvp_deadline: iso ? frenchLongDate(iso) : "",
        allow_partner: config.allow_partner !== false,
        collect_message: config.collect_message !== false,
        dietary_options: strings(config.dietary_options, 15, 60, "Régimes alimentaires"),
      };
      break;
    }

    case "map":
    case "playlist":
    case "accommodation":
      cleaned = { description: text(config.description, 2000, "Présentation") };
      break;

    case "intro-video":
      cleaned = {
        title: text(config.title, 160, "Titre"),
        subtitle: text(config.subtitle, 160, "Sous-titre"),
        description: text(config.description, 2000, "Texte"),
        videoUrl: link(config.videoUrl, "Vidéo"),
        videoType: config.videoType === "upload" ? "upload" : "embed",
      };
      break;

    case "gift-list":
      cleaned = {
        title: text(config.title, 160, "Titre"),
        description: text(config.description, 2000, "Texte"),
        gift_list_url: link(config.gift_list_url, "Lien de la liste"),
        gift_list_label: text(config.gift_list_label, 80, "Libellé du lien"),
      };
      break;

    case "transport":
      cleaned = {
        options: list(config.options, 10, "Transports").map((raw) => {
          const option = record(raw, "Transport");
          return {
            id: rowId(option.id),
            iconType:
              typeof option.iconType === "string" && TRANSPORT_ICONS.has(option.iconType)
                ? option.iconType
                : "Car",
            title: text(option.title, 80, "Mode de transport"),
            description: text(option.description, 1000, "Indications"),
          };
        }),
        carpoolUrl: link(config.carpoolUrl, "Lien de covoiturage"),
        carpoolLinkLabel: text(config.carpoolLinkLabel, 80, "Libellé du lien"),
        carpoolDescription: text(config.carpoolDescription, 1000, "Covoiturage"),
      };
      break;

    case "menu":
      cleaned = {
        sections: list(config.sections, 12, "Menu").map((raw) => {
          const section = record(raw, "Plat");
          return {
            id: rowId(section.id),
            title: text(section.title, 80, "Section du menu"),
            items: list(section.items, 30, "Plats").map((rawItem) => {
              const item = record(rawItem, "Plat");
              return {
                title: text(item.title, 160, "Plat"),
                description: text(item.description, 500, "Description du plat"),
              };
            }),
          };
        }),
        dietaryNote: text(config.dietaryNote, 500, "Note sur les régimes"),
        footer: strings(config.footer, 6, 200, "Mentions"),
      };
      break;

    case "gallery":
      cleaned = {
        images: list(config.images, 12, "Galerie").map((raw) => {
          const url = link(raw, "Photo");
          if (!url) throw new EditorValidationError("Photo de galerie invalide.");
          return url;
        }),
      };
      break;

    case "guestbook":
    case "video-guestbook":
      cleaned = {
        title: text(config.title, 160, "Titre"),
        description: text(config.description, 1000, "Texte d'accueil"),
      };
      break;

    case "faq":
      // Only ever emptied, by "reprendre ces questions": the questions
      // themselves now live in `faq_entries`.
      if (list(config.questions, 0, "FAQ").length > 0) {
        throw new EditorValidationError("Les questions se gèrent dans la liste de la FAQ.");
      }
      cleaned = { questions: [] };
      break;

    default:
      throw new EditorValidationError("Ce module n'a pas de réglages.");
  }

  return { ...previous, ...cleaned };
}

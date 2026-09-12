/**
 * The content a couple writes on the dashboard's module screens.
 *
 * `site_modules.config` is a free-form jsonb column: the dashboard saves
 * whatever shape its form produced, and nothing validates it on the way in.
 * This module is the one place that reads it, so it is also the only place
 * that has to cope with that — everything below narrows an `unknown` into a
 * typed value or drops it.
 *
 * ## Why the keys look inconsistent
 *
 * They are. The dashboard grew form by form, so the same idea is spelled
 * differently depending on which screen wrote it: `gift_list_url` in
 * snake_case beside `imageUrl` in camelCase, `questions` for the FAQ but
 * `events` for the timeline, `options` for both hotels and transport modes
 * though the objects differ. The names below match what is actually in the
 * database, not what it should have been called — renaming them would
 * silently orphan every row already written.
 *
 * `MODULE_PREVIEW_DEFAULTS` in the dashboard describes a DIFFERENT shape
 * (`items` vs `events`, `hotels` vs `options`, `courses` vs `sections`). It
 * feeds locked previews before purchase and is not what gets saved; reading it
 * as a reference here would produce a mapper that matches nothing.
 */

/* ------------------------------------------------------------------ *
 * Narrowing helpers
 * ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A trimmed string, or undefined — empty strings are absent content. */
function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/* ------------------------------------------------------------------ *
 * Per-module shapes
 * ------------------------------------------------------------------ */

export type TimelineEntryConfig = {
  time?: string;
  title?: string;
  location?: string;
  description?: string;
  /** Written only at save time; absent on rows the form never re-saved. */
  orderIndex?: number;
};

export type AccommodationConfig = {
  name?: string;
  distance?: string;
  description?: string;
  url?: string;
  urlLabel?: string;
};

export type TransportConfig = {
  iconType?: string;
  title?: string;
  description?: string;
};

export type MenuSectionConfig = {
  title?: string;
  items: Array<{ title?: string; description?: string }>;
};

export type FaqConfig = { question?: string; answer?: string };

/**
 * Everything the module screens hold, keyed by concern rather than by module.
 *
 * Flat on purpose: a theme asks "is there a dress code?", never "what did the
 * dress-code module save?".
 */
export type ModuleContent = {
  venue: {
    name?: string;
    address?: string;
    description?: string;
    imageUrl?: string;
    imageOrientation?: "portrait" | "landscape";
  };
  dressCode: {
    title?: string;
    subtitle?: string;
    /** "split" means the couple wrote separate guidance per audience. */
    mode?: "global" | "split";
    description?: string;
    descriptionMen?: string;
    descriptionWomen?: string;
  };
  introVideo: {
    title?: string;
    subtitle?: string;
    description?: string;
    videoUrl?: string;
    videoType?: "embed" | "upload";
  };
  giftList: { description?: string; url?: string; label?: string };
  playlist: { description?: string };
  timeline: TimelineEntryConfig[];
  accommodation: {
    title?: string;
    subtitle?: string;
    description?: string;
    options: AccommodationConfig[];
  };
  transport: {
    options: TransportConfig[];
    carpoolUrl?: string;
    carpoolLinkLabel?: string;
    carpoolDescription?: string;
  };
  menu: { sections: MenuSectionConfig[]; dietaryNote?: string; footer: string[] };
  faq: { title?: string; subtitle?: string; description?: string; questions: FaqConfig[] };
  gallery: { images: string[] };
  /**
   * The RSVP deadline, exactly as stored.
   *
   * Deliberately NOT parsed into a date. The dashboard writes it already
   * formatted in the couple's own locale ("14 novembre 2026"), so there is no
   * machine-readable value to recover — `new Date()` returns Invalid Date for
   * the French form, which is why re-opening that screen loses the date. A
   * theme prints this string; the real deadline belongs in a column.
   */
  rsvpDeadlineLabel?: string;
};

/** One row of `public_module_configs`. */
export type ModuleConfigRow = {
  module_id: string;
  position: number | null;
  config: unknown;
};

const EMPTY: ModuleContent = {
  venue: {},
  dressCode: {},
  introVideo: {},
  giftList: {},
  playlist: {},
  timeline: [],
  accommodation: { options: [] },
  transport: { options: [] },
  menu: { sections: [], footer: [] },
  faq: { questions: [] },
  gallery: { images: [] },
};

/* ------------------------------------------------------------------ *
 * The reader
 * ------------------------------------------------------------------ */

/**
 * Turns the raw rows into typed content.
 *
 * Every field is optional and every list may be empty: a couple who bought a
 * module and never opened its screen has a row with `config = {}`, and one who
 * opened it and saved has whatever the form produced. Neither is an error.
 *
 * Entries that carry no content at all are dropped rather than passed through
 * empty — the forms keep a blank row on screen so there is something to type
 * into, and that blank row must not become an empty line on the invitation.
 */
export function readModuleConfigs(rows: ModuleConfigRow[]): ModuleContent {
  const content: ModuleContent = structuredClone(EMPTY);

  for (const row of rows) {
    const config = isRecord(row.config) ? row.config : {};

    switch (row.module_id) {
      case "map":
        content.venue = {
          name: str(config.name),
          address: str(config.address),
          description: str(config.description),
          imageUrl: str(config.imageUrl),
          imageOrientation:
            config.imageOrientation === "portrait" ? "portrait" : "landscape",
        };
        break;

      case "dress-code":
        content.dressCode = {
          title: str(config.title),
          subtitle: str(config.subtitle),
          mode: config.mode === "split" ? "split" : "global",
          description: str(config.description),
          descriptionMen: str(config.description_men),
          descriptionWomen: str(config.description_women),
        };
        break;

      case "intro-video":
        content.introVideo = {
          title: str(config.title),
          subtitle: str(config.subtitle),
          description: str(config.description),
          videoUrl: str(config.videoUrl),
          videoType: config.videoType === "upload" ? "upload" : "embed",
        };
        break;

      case "gift-list":
        content.giftList = {
          description: str(config.description),
          url: str(config.gift_list_url),
          label: str(config.gift_list_label),
        };
        break;

      case "playlist":
        content.playlist = { description: str(config.description) };
        break;

      case "rsvp":
        content.rsvpDeadlineLabel = str(config.rsvp_deadline);
        break;

      case "timeline":
        content.timeline = list(config.events)
          .map((entry) => ({
            time: str(entry.time),
            title: str(entry.title),
            location: str(entry.location),
            description: str(entry.description),
            orderIndex:
              typeof entry.order_index === "number" ? entry.order_index : undefined,
          }))
          // A row with neither a time nor a title is the blank one the form
          // always keeps on screen.
          .filter((entry) => entry.time || entry.title);
        break;

      case "accommodation":
        content.accommodation = {
          title: str(config.title),
          subtitle: str(config.subtitle),
          description: str(config.description),
          options: list(config.options)
            .map((option) => ({
              name: str(option.name),
              distance: str(option.distance),
              description: str(option.description),
              url: str(option.url),
              urlLabel: str(option.urlLabel),
            }))
            .filter((option) => option.name),
        };
        break;

      case "transport":
        content.transport = {
          options: list(config.options)
            .map((option) => ({
              iconType: str(option.iconType),
              title: str(option.title),
              description: str(option.description),
            }))
            // A mode with a label but no directions says nothing: the labels
            // ("En Train") are defaults the couple may never have filled in.
            .filter((option) => option.description),
          carpoolUrl: str(config.carpoolUrl),
          carpoolLinkLabel: str(config.carpoolLinkLabel),
          carpoolDescription: str(config.carpoolDescription),
        };
        break;

      case "menu":
        content.menu = {
          sections: list(config.sections)
            .map((section) => ({
              title: str(section.title),
              items: list(section.items)
                .map((item) => ({
                  title: str(item.title),
                  description: str(item.description),
                }))
                .filter((item) => item.title),
            }))
            // Course headings are defaults ("Le Plat"); a section with no dish
            // is a heading the couple never filled in.
            .filter((section) => section.items.length > 0),
          dietaryNote: str(config.dietaryNote),
          footer: (Array.isArray(config.footer) ? config.footer : [])
            .map(str)
            .filter((entry): entry is string => Boolean(entry)),
        };
        break;

      case "faq":
        content.faq = {
          title: str(config.title),
          subtitle: str(config.subtitle),
          description: str(config.description),
          questions: list(config.questions)
            .map((entry) => ({
              question: str(entry.question),
              answer: str(entry.answer),
            }))
            // Half an entry is worse than none: a question with no answer
            // reads as an oversight on a page guests trust.
            .filter((entry) => entry.question && entry.answer),
        };
        break;

      case "gallery":
        content.gallery = {
          images: (Array.isArray(config.images) ? config.images : [])
            .map(str)
            .filter((url): url is string => Boolean(url)),
        };
        break;

      // `countdown`, `guestbook` and `video-guestbook` have no config screen;
      // an unknown id is a module added since this was written.
      default:
        break;
    }
  }

  return content;
}

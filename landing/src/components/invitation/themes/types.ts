/**
 * The shared contract every invitation theme implements.
 *
 * This file is the reason a theme can be added by dropping in a folder: the
 * registry, the marketing carousel, the studio picker and the demo routes all
 * read a theme through these types rather than knowing anything about it.
 *
 * A theme owns its look. It does NOT own the shape of a couple's data — that
 * shape lives in `InvitationData` below and is the same for every theme, so
 * one wedding's content can be rendered by any of them.
 */

import type { ComponentType } from "react";

import { SCHEDULE_ICON_KEYS } from "@shared/data/schedule-icons";
import type { EventKey } from "@shared/types/invitation";

/* ------------------------------------------------------------------ *
 * Modules
 * ------------------------------------------------------------------ */

/**
 * The module ids mirror `public.modules` in Supabase, which is what the
 * dashboard and the checkout already use. Keep the two in sync: a value here
 * that has no row there cannot be sold, ordered, or configured.
 */
export const MODULE_IDS = [
  "countdown",
  "intro-video",
  "timeline",
  "dress-code",
  "rsvp",
  "map",
  "accommodation",
  "transport",
  "menu",
  "gallery",
  "gift-list",
  "playlist",
  "guestbook",
  "video-guestbook",
  "faq",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

/* ------------------------------------------------------------------ *
 * Invitation content — one shape, every theme
 * ------------------------------------------------------------------ */

/**
 * What a moment in the day *is*, so any theme can draw it.
 *
 * Named for the event, never for a picture of it: each theme has its own
 * artwork — an engraved line, a CSS glyph, a drawn spritz — and they agree on
 * what a ceremony is, not on how to depict one.
 *
 * This used to be an open `string` described as a "theme-defined icon key",
 * and the three themes invented disjoint sets: `heart`/`cheers`/`cutlery`,
 * `rings`/`glasses`/`dinner`, `church`/`spritz`/`plate`. An entry written for
 * one theme therefore fell back to a default in the other two, which
 * contradicts the promise at the top of this file — that one wedding's content
 * can be rendered by any theme.
 */
export const SCHEDULE_ICONS = SCHEDULE_ICON_KEYS;

export type ScheduleIcon = (typeof SCHEDULE_ICONS)[number];

export type ScheduleEntry = {
  /** 1 for the wedding day, 2 for the day after (brunch, pool party…). */
  day: 1 | 2;
  /** Display string, kept verbatim: themes disagree on "17h00" vs "17 h 00". */
  time: string;
  title: string;
  description?: string;
  /**
   * Which moment this is. Every theme draws all five in its own style; an
   * entry that names none gets the theme's neutral mark.
   */
  icon?: ScheduleIcon;
  image?: string;
  /**
   * The event this moment belongs to (`InvitationData.events[].kind`), so a
   * theme can print each event's moments under it. Absent for a programme
   * built on the old timeline module screen, which knew no events.
   */
  event?: EventKey;
};

/**
 * One of the couple's events: the day itself, or what surrounds it — a
 * welcome dinner the evening before, a party, the brunch after. A wedding has
 * at most one of each kind.
 *
 * Everything here is what the couple typed in the editor's programme, where
 * each event has a card; a theme that prints none of it offers them fields
 * that change nothing.
 */
export type WeddingEvent = {
  kind: EventKey;
  name: string;
  /** ISO day (YYYY-MM-DD). Themes format it in the page's language. */
  date?: string;
  /** Display string, kept verbatim, like `ScheduleEntry.time`. */
  time?: string;
  address?: string;
  description?: string;
  /** One line — "Chic champêtre". The dress-code module says more. */
  dressCode?: string;
  /** As `ScheduleEntry.day`: 2 for the day after. */
  day: 1 | 2;
};

export type Stay = {
  name: string;
  city?: string;
  address?: string;
  /** Free text — "à 10 min du domaine", "8 min". */
  distance?: string;
  url?: string;
  bookingCode?: string;
  offer?: string;
  /** Printed as the couple typed it — "04 90 12 34 56". */
  phone?: string;
  image?: string;
  /** Rendered behind a "voir plus d'options" toggle rather than up front. */
  secondary?: boolean;
};

export type FaqEntry = {
  /**
   * Stable key for an entry whose content a setting decides, so a couple's own
   * version can replace the derived default instead of appearing beside it.
   * See `themes/faq.ts`. Free-text entries leave it unset.
   */
  id?: string;
  question: string;
  answer: string;
};

export type PlaylistSuggestion = { title: string; artist: string };

export type DressCode = {
  title: string;
  body?: string;
  /** CSS colours for the palette swatches. */
  colors?: string[];
  note?: string;
  image?: string;
};

export type Venue = {
  name: string;
  city?: string;
  country?: string;
  address?: string;
  mapsUrl?: string;
  wazeUrl?: string;
  image?: string;
  /**
   * "En voiture" / "En avion" style directions. `link` is a page the couple
   * published for that mode — the carpool board — with their wording for it.
   */
  access?: Array<{ mode: string; details: string[]; link?: { url: string; label?: string } }>;
};

/**
 * Everything a theme may render. Optional fields are genuinely optional: a
 * theme must degrade gracefully when a couple has not filled a section in,
 * and when a module they did not buy is absent.
 */
export type InvitationData = {
  /**
   * The wedding this invitation belongs to, when it belongs to one.
   *
   * This is the single switch between the two modes a theme runs in:
   *
   *   - present  → a real invitation. Guest submissions (RSVP, playlist) are
   *                persisted against this wedding.
   *   - absent   → a demo. The theme renders identically but every form stays
   *                local: it shows its confirmation state and writes nothing.
   *
   * It is deliberately part of the contract rather than inferred from the URL:
   * a theme is rendered by the demo route, by the studio's live preview and by
   * the real invitation page, and only the caller knows which. `demo-data.ts`
   * must never set it — that is what keeps the public showcase out of the
   * database.
   */
  weddingId?: string;

  couple: {
    partner1: string;
    partner2: string;
    /**
     * "V & G", as the couple wrote it in the editor — absent when they wrote
     * none, or cleared it. A theme whose design needs one falls back to the
     * initials itself (`blanc-couture`); the others print nothing.
     */
    monogram?: string;
    /**
     * A photograph of the couple, uploaded in the editor's footer tab — so a
     * theme draws it on its closing page.
     *
     * Absent until the couple uploads one, and a theme must then render its
     * closing page without it rather than substitute a stock image.
     * `blanc-couture` used to hardcode the demo couple's portrait here,
     * captioned with whoever's names the invitation carried.
     */
    portrait?: string;
  };

  event: {
    /** ISO 8601 with offset. Drives the countdown; never assume a timezone. */
    startsAt: string;
    /** ISO date (YYYY-MM-DD) for the RSVP cut-off. */
    rsvpDeadline?: string;
    timezone?: string;
  };

  venue: Venue;

  /** Theme-facing copy. Every field is a sentence a couple could rewrite. */
  copy?: {
    heroKicker?: string;
    announcement?: string;
    /** "05 · 01 · 2027" — themes that format their own ignore this. */
    dateLabel?: string;
    /** "Mardi cinq janvier" */
    dateSpelled?: string;
    venueIntro?: string;
    scheduleIntro?: string;
    rsvpIntro?: string;
    rsvpNote?: string;
    playlistIntro?: string;
    staysIntro?: string;
    closing?: string;
    footerNote?: string;
  };

  schedule?: ScheduleEntry[];
  /** The couple's events, in their order. See `WeddingEvent`. */
  events?: WeddingEvent[];
  /** Day-2 block when a theme renders it apart from the timeline. */
  dayTwo?: {
    dateLabel?: string;
    title?: string;
    timeLabel?: string;
    body?: string;
    note?: string;
    image?: string;
  };

  /**
   * The gift note, for the `gift-list` module.
   *
   * A theme must render nothing when this is absent. `belle-rive` used to
   * carry a whole gift section in its markup — an urn on the day, a bank
   * transfer to come — which is a promise about a couple's own arrangements,
   * made to every wedding that bought the module.
   */
  gifts?: {
    title?: string;
    body?: string;
    /** A registry or contribution page the couple published. */
    url?: string;
    /** The link's wording — "Contribuer à notre voyage de noces". */
    linkLabel?: string;
  };

  dressCode?: DressCode;

  /**
   * The intro-video module: a film that welcomes guests. `url` is always a
   * web link — an embed page (YouTube, Vimeo) when `kind` is "embed", a video
   * file the couple uploaded when it is "file". A theme must render nothing for
   * an embed host it does not know how to frame.
   */
  introVideo?: {
    title?: string;
    subtitle?: string;
    body?: string;
    url: string;
    kind: "embed" | "file";
  };

  /** The menu module: courses, each with its dishes, and the small print. */
  menu?: {
    sections: Array<{ title?: string; items: Array<{ title: string; description?: string }> }>;
    /** "Menu végétarien sur demande". */
    note?: string;
    footer?: string[];
  };

  /** The gallery module: the couple's photographs, in their order. */
  gallery?: { images: string[] };

  stays?: Stay[];
  faq?: FaqEntry[];
  playlist?: PlaylistSuggestion[];

  rsvp?: {
    allowPartner?: boolean;
    /**
     * Whether a guest may declare accompanying children.
     *
     * Mirrors `settings.adults_only` (migration 20260324100000), which the
     * couple sets in the studio's options step — inverted on the way in, so a
     * theme reads a positive statement instead of a negation:
     *
     *     allowChildren: !settings.adults_only
     *
     * Defaults to `true` when absent, matching the column's `DEFAULT false`:
     * a wedding that never answered the question accepts children. An
     * adults-only wedding must render NO child field at all — not a disabled
     * one — so the form never suggests what the couple has ruled out.
     */
    allowChildren?: boolean;
    dietaryOptions?: string[];
    collectMessage?: boolean;
    /** carte-blanche asks about these two as separate RSVP questions. */
    collectWelcomeDinner?: boolean;
    collectBrunch?: boolean;
  };

  /** Which modules this wedding actually bought, in render order. */
  modules?: ModuleId[];

  /**
   * The theme's own words, as the couple rewrote them in the editor.
   *
   * Keyed `<sectionId>.<role>` — `countdown.eyebrow`, `faq.title`,
   * `timeline.ribbon` — the keys a theme declares in its `editorSlots`. A
   * theme reads `data.texts?.[key]` and falls back to its own catalogue, so
   * a couple who rewrote nothing sees the theme exactly as designed.
   *
   * Absent on the demos, and absent for a wedding that never changed a word.
   * A value may hold a line break where the theme sets that text on two lines.
   */
  texts?: Readonly<Record<string, string>>;

  /**
   * The Jour J guest page, present only when the couple switched it on.
   *
   * The Jour J (seating finder, shared photos) is included with every wedding
   * and is deliberately not a module, so it has no entry in `modules`. A theme
   * that wants to point guests at it reads this: `slug` builds the paths
   * (`/jourj/<slug>/ma-table`, `/jourj/<slug>/photos`), and `photos` is true
   * while the upload window is open or the gallery is visible to guests.
   *
   * Absent in the editor's preview. A demo may set it to show the block, but a
   * theme given a `dayOf` and no `weddingId` is showing its showcase and must
   * render the buttons inert, never as links to a page that would 404.
   */
  dayOf?: { slug: string; photos: boolean };
};

/* ------------------------------------------------------------------ *
 * Theme manifest
 * ------------------------------------------------------------------ */

export type ThemeManifest = {
  /** Folder name and DB value for `sites.theme_id`. Kebab-case. */
  id: string;
  /** Shown in the carousel and the studio picker. */
  name: string;
  /** One line, customer-facing. */
  description: string;

  /**
   * Modules this theme has a section for. A module the couple bought but the
   * theme cannot render is dropped — silently, and that is intentional: the
   * alternative is an unstyled block in the middle of a paid invitation.
   */
  supports: readonly ModuleId[];

  /** Swatch shown on the theme card, before the iframe loads. */
  accentColor: string;
  /** Cover image for the marketing carousel. */
  cover?: string;

  /** Class applied to the theme root; every rule in its CSS sits under it. */
  scopeClass: string;
  /** `next/font` variable classes, applied alongside `scopeClass`. */
  fontVars: string;

  /** Rendered by the demo route and the live preview. */
  demoData: InvitationData;

  /**
   * The theme's own root component. It receives the whole invitation and
   * decides how to lay it out — themes differ too much for a shared shell.
   */
  Root: ComponentType<{ data: InvitationData }>;

  /**
   * Every word this theme prints that a couple may rewrite.
   *
   * Read by the editor's live preview, which resolves each default in the
   * invitation's language and hands the list to the dashboard, where each
   * slot becomes a field with that default as its placeholder. A theme that
   * declares none simply offers no such fields — nothing breaks.
   */
  editorSlots?: readonly ThemeEditorSlot[];
};

/**
 * One rewritable word of a theme — see `ThemeManifest.editorSlots`.
 *
 * The theme itself renders `data.texts?.[key] ?? <its catalogue text>`; this
 * declaration is what tells the editor the slot exists and what it says today.
 */
export type ThemeEditorSlot = {
  /**
   * `<sectionId>.<role>`, where the section id is one of
   * `shared/data/invitation-sections.ts`. Keep roles generic (`eyebrow`,
   * `title`) wherever they can be: a key means the same thing in every theme.
   */
  key: string;
  /**
   * Full catalogue keys (`Invitation.ciaoAmore.faq.titleLine1`) whose
   * messages, joined by a line break, are the default text.
   */
  messages: readonly string[];
  /** Set on two lines by the theme: the couple's value may hold a line break. */
  multiline?: boolean;
};

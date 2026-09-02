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

export type ScheduleEntry = {
  /** 1 for the wedding day, 2 for the day after (brunch, pool party…). */
  day: 1 | 2;
  /** Display string, kept verbatim: themes disagree on "17h00" vs "17 h 00". */
  time: string;
  title: string;
  description?: string;
  /** Theme-defined icon key; ignored by themes that draw their own. */
  icon?: string;
  image?: string;
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
  /** "En voiture" / "En avion" style directions. */
  access?: Array<{ mode: string; details: string[] }>;
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
    /** "V & G" — themes that print a monogram fall back to initials. */
    monogram?: string;
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
  /** Day-2 block when a theme renders it apart from the timeline. */
  dayTwo?: {
    dateLabel?: string;
    title?: string;
    timeLabel?: string;
    body?: string;
    note?: string;
    image?: string;
  };

  dressCode?: DressCode;
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
};

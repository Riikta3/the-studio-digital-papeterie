import type { ScheduleIconKey } from "@shared/data/schedule-icons";
import type { AmountDue } from "@shared/lib/addable-modules";
import type { EventKey } from "@shared/types/invitation";

/**
 * The invitation editor's model of a wedding: everything the couple can change
 * on their invitation, in one object.
 *
 * Every field is a plain value — strings rather than `string | null`, arrays in
 * display order rather than rows with a `position` — because this is what the
 * forms bind to. `loadInvitationEditor` builds it from the tables, and
 * `saveInvitationDraft` takes it apart again; nothing else knows the columns.
 *
 * The object is split into "units", each saved on its own: a failure writing
 * the FAQ must not undo the venue that was saved a moment before it.
 */

/** Ids minted in the browser for rows that do not exist yet. The server replaces them. */
export const NEW_ID_PREFIX = "new_";

export function isNewId(id: string): boolean {
  return id.startsWith(NEW_ID_PREFIX);
}

export type EditorEvent = {
  id: string;
  key: EventKey;
  name: string;
  /** `YYYY-MM-DD`, or empty. */
  date: string;
  /** The couple's own wording — "17h00", "17 h 00", "5pm". */
  time: string;
  address: string;
  description: string;
  dressCode: string;
  /** A disabled event stays editable but is invisible to guests. */
  enabled: boolean;
};

export type EditorScheduleEntry = {
  id: string;
  eventId: string;
  time: string;
  title: string;
  description: string;
  /** Empty lets the invitation guess the moment from the title. */
  icon: ScheduleIconKey | "";
  imageUrl: string;
};

export type EditorVenue = {
  name: string;
  address: string;
  city: string;
  mapsUrl: string;
  wazeUrl: string;
  parkingInfo: string;
  accessInfo: string;
  transportInfo: string;
  photoUrl: string;
};

export type EditorAccommodation = {
  id: string;
  name: string;
  city: string;
  distance: string;
  address: string;
  phone: string;
  bookingUrl: string;
  offer: string;
  photoUrl: string;
  /** Behind the invitation's "voir plus d'options" toggle. */
  secondary: boolean;
};

export type EditorFaqEntry = {
  id: string;
  question: string;
  answer: string;
  published: boolean;
};

/** `site_modules.config` — free-form, cleaned per module on save. */
export type ModuleConfig = Record<string, unknown>;

export type EditorState = {
  names: { partner1: string; partner2: string };
  settings: {
    heroKicker: string;
    announcement: string;
    closingWords: string;
    couplePhotoUrl: string;
    /** `settings.adults_only`: no child fields on the RSVP, and the FAQ says so. */
    adultsOnly: boolean;
  };
  /** `settings.invitation_texts` — see `shared/data/invitation-texts.ts`. */
  texts: Record<string, string>;
  /** In display order. */
  events: EditorEvent[];
  /** In display order within each event. */
  schedule: EditorScheduleEntry[];
  venue: EditorVenue;
  accommodations: EditorAccommodation[];
  faq: EditorFaqEntry[];
  /** Keyed by module id; only modules the wedding owns. */
  modules: Record<string, ModuleConfig>;
};

/** One independently saved part of the state. */
export type EditorUnit =
  | Exclude<keyof EditorState, "modules">
  | `modules.${string}`;

/** Only the parts that changed. `modules` carries only the changed modules. */
export type EditorChanges = Partial<Omit<EditorState, "modules">> & {
  modules?: Record<string, ModuleConfig>;
};

export type EditorMeta = {
  themeId: string | null;
  /** `sites.modules`, known ids only, in the couple's module order. */
  ownedModules: string[];
  /** `sites.plan_id` — prices the modules added after the sale (`addOnQuote`). */
  planId: string | null;
  /**
   * `sites.pending_modules`: saved but not paid, invisible to guests, in the
   * order they were added (spec D3).
   */
  pendingModules: string[];
  /** `sites.languages`, the couple's own first. */
  languages: string[];
  slug: string | null;
  published: boolean;
  /** Where guests read the invitation: the base of "Voir mon faire-part". */
  landingUrl: string;
  /**
   * The landing that draws the live preview — the local one in development,
   * which runs the same code as this editor. See `lib/editor-preview-url.ts`.
   */
  previewUrl: string;
  /**
   * FAQ questions written in the old FAQ module screen. They still show on the
   * invitation (the mapper appends them), so the FAQ tab offers to take them
   * over into the list the editor manages.
   */
  legacyFaq: Array<{ question: string; answer: string }>;
};

export type EditorBootstrap = { state: EditorState; meta: EditorMeta };

/** Where the modules stand after a save, a payment or a removal. */
export type ModuleLists = { owned: string[]; pending: string[] };

/**
 * What a save returns.
 *
 * `state` is the invitation as it now stands in the database — after every
 * unit that succeeded — so the editor can take it as its new "saved" copy and
 * keep the draft only for the units that failed. Null when nothing could be
 * read back at all (the session expired).
 */
export type SaveResult =
  | { ok: true; state: EditorState; modules: ModuleLists; due: AmountDue | null }
  | {
      ok: false;
      state: EditorState | null;
      errors: Partial<Record<EditorUnit, string>>;
      /**
       * Real ids of the rows created before the failure, keyed by the
       * `new_…` id the draft gave them. When the events saved but the
       * programme did not, the draft's moments still point at the old
       * `new_…` event ids; this is how the editor re-points them.
       */
      createdIds: Record<string, string>;
      modules?: ModuleLists;
      due?: AmountDue | null;
    };

/** Folders `uploadEditorImage` may write into, under `<wedding_id>/` in the `venue` bucket. */
export const EDITOR_IMAGE_FOLDERS = [
  "venue",
  "accommodations",
  "couple",
  "dress-code",
  "schedule",
  "gifts",
] as const;

export type EditorImageFolder = (typeof EDITOR_IMAGE_FOLDERS)[number];

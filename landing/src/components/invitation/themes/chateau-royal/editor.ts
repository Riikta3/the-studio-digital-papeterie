import type { ThemeEditorSlot } from "../types";

/**
 * Every word "Château Royal" prints in its own voice, and which a couple may
 * rewrite in the editor.
 *
 * Each entry names the catalogue messages that supply the default; the
 * sections read `slot(data, key) ?? t(...)` with the same keys, so a slot
 * listed here and a slot the markup honours are the same thing. The defaults
 * are neutral: the designer's own wording for the showcase lives in the demo's
 * `texts`.
 */
const NS = "Invitation.chateauRoyal";

export const chateauRoyalEditorSlots: readonly ThemeEditorSlot[] = [
  // The letter that follows the hero.
  { key: "hero.letterIntro", messages: [`${NS}.letter.intro`] },
  {
    key: "hero.letterTitle",
    messages: [`${NS}.letter.titleLine1`, `${NS}.letter.titleLine2`],
    multiline: true,
  },

  // The time left, engraved under the letter.
  { key: "countdown.eyebrow", messages: [`${NS}.countdown.eyebrow`] },
  { key: "countdown.note", messages: [`${NS}.countdown.note`] },

  // The place.
  { key: "map.eyebrow", messages: [`${NS}.venue.eyebrow`] },
  {
    key: "map.title",
    messages: [`${NS}.venue.titleLine1`, `${NS}.venue.titleLine2`],
    multiline: true,
  },

  // The couple's film.
  { key: "intro-video.eyebrow", messages: [`${NS}.film.eyebrow`] },

  // The programme and the day after.
  { key: "timeline.title", messages: [`${NS}.programme.title`] },
  { key: "timeline.intro", messages: [`${NS}.programme.intro`] },
  { key: "timeline.dayOne", messages: [`${NS}.programme.dayOne`] },
  { key: "timeline.dayTwo", messages: [`${NS}.programme.dayTwo`] },
  { key: "timeline.dressLabel", messages: [`${NS}.programme.dressLabel`] },

  // The dinner.
  { key: "menu.eyebrow", messages: [`${NS}.menu.eyebrow`] },
  {
    key: "menu.title",
    messages: [`${NS}.menu.titleLine1`, `${NS}.menu.titleLine2`],
    multiline: true,
  },

  // The ball's dance card: the guests' songs.
  { key: "playlist.eyebrow", messages: [`${NS}.playlist.eyebrow`] },
  {
    key: "playlist.title",
    messages: [`${NS}.playlist.titleLine1`, `${NS}.playlist.titleLine2`],
    multiline: true,
  },
  { key: "playlist.intro", messages: [`${NS}.playlist.intro`] },
  { key: "playlist.picks", messages: [`${NS}.playlist.picks`] },

  // The gallery.
  { key: "gallery.eyebrow", messages: [`${NS}.gallery.eyebrow`] },
  {
    key: "gallery.title",
    messages: [`${NS}.gallery.titleLine1`, `${NS}.gallery.titleLine2`],
    multiline: true,
  },

  // The small details: the dress code, the ways to get there, the questions.
  { key: "faq.eyebrow", messages: [`${NS}.practical.eyebrow`] },
  { key: "faq.title", messages: [`${NS}.practical.title`] },

  // Where to sleep.
  { key: "accommodation.eyebrow", messages: [`${NS}.stays.eyebrow`] },
  { key: "accommodation.title", messages: [`${NS}.stays.title`] },

  // The gift note.
  { key: "gift-list.eyebrow", messages: [`${NS}.gifts.eyebrow`] },

  // The reply.
  { key: "rsvp.eyebrow", messages: [`${NS}.rsvp.eyebrow`] },
  {
    key: "rsvp.title",
    messages: [`${NS}.rsvp.titleLine1`, `${NS}.rsvp.titleLine2`],
    multiline: true,
  },
];

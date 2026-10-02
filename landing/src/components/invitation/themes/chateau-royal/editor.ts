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

  // The place.
  { key: "map.eyebrow", messages: [`${NS}.venue.eyebrow`] },
  {
    key: "map.title",
    messages: [`${NS}.venue.titleLine1`, `${NS}.venue.titleLine2`],
    multiline: true,
  },

  // The programme and the day after.
  { key: "timeline.title", messages: [`${NS}.programme.title`] },
  { key: "timeline.intro", messages: [`${NS}.programme.intro`] },
  { key: "timeline.dayOne", messages: [`${NS}.programme.dayOne`] },
  { key: "timeline.dayTwo", messages: [`${NS}.programme.dayTwo`] },

  // The dinner.
  { key: "menu.eyebrow", messages: [`${NS}.menu.eyebrow`] },
  {
    key: "menu.title",
    messages: [`${NS}.menu.titleLine1`, `${NS}.menu.titleLine2`],
    multiline: true,
  },

  // The small details: the dress code, the ways to get there, the questions.
  { key: "faq.eyebrow", messages: [`${NS}.practical.eyebrow`] },
  { key: "faq.title", messages: [`${NS}.practical.title`] },

  // The reply.
  { key: "rsvp.eyebrow", messages: [`${NS}.rsvp.eyebrow`] },
  {
    key: "rsvp.title",
    messages: [`${NS}.rsvp.titleLine1`, `${NS}.rsvp.titleLine2`],
    multiline: true,
  },
];

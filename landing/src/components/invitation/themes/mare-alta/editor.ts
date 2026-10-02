import type { ThemeEditorSlot } from "../types";

/**
 * Every word "Maré Alta" prints in its own voice that a couple may rewrite.
 * Each entry names the catalogue messages that supply the default; the sections
 * read `slot(data, key) ?? t(...)` with the same keys. Declaring a slot no
 * section reads offers a field that changes nothing: `theme-checks.test.mjs`
 * fails on it.
 */
const NS = "Invitation.mareAlta";

export const mareAltaEditorSlots: readonly ThemeEditorSlot[] = [
  { key: "hero.cta", messages: [`${NS}.hero.cta`] },

  { key: "countdown.eyebrow", messages: [`${NS}.countdown.eyebrow`] },
  {
    key: "countdown.title",
    messages: [`${NS}.countdown.titleLine1`, `${NS}.countdown.titleLine2`],
    multiline: true,
  },
  { key: "countdown.note", messages: [`${NS}.countdown.note`] },

  { key: "map.eyebrow", messages: [`${NS}.map.eyebrow`] },

  { key: "timeline.eyebrow", messages: [`${NS}.timeline.eyebrow`] },
  {
    key: "timeline.title",
    messages: [`${NS}.timeline.titleLine1`, `${NS}.timeline.titleLine2`],
    multiline: true,
  },
  { key: "timeline.sign", messages: [`${NS}.timeline.sign`] },

  { key: "dress-code.eyebrow", messages: [`${NS}.dressCode.eyebrow`] },

  { key: "accommodation.eyebrow", messages: [`${NS}.stays.eyebrow`] },
  {
    key: "accommodation.title",
    messages: [`${NS}.stays.titleLine1`, `${NS}.stays.titleLine2`],
    multiline: true,
  },

  { key: "transport.eyebrow", messages: [`${NS}.transport.eyebrow`] },
  {
    key: "transport.title",
    messages: [`${NS}.transport.titleLine1`, `${NS}.transport.titleLine2`],
    multiline: true,
  },
  { key: "transport.intro", messages: [`${NS}.transport.intro`] },

  { key: "menu.eyebrow", messages: [`${NS}.menu.eyebrow`] },
  {
    key: "menu.title",
    messages: [`${NS}.menu.titleLine1`, `${NS}.menu.titleLine2`],
    multiline: true,
  },

  { key: "playlist.eyebrow", messages: [`${NS}.playlist.eyebrow`] },
  {
    key: "playlist.title",
    messages: [`${NS}.playlist.titleLine1`, `${NS}.playlist.titleLine2`],
    multiline: true,
  },
  { key: "playlist.intro", messages: [`${NS}.playlist.intro`] },

  { key: "gift-list.eyebrow", messages: [`${NS}.gifts.eyebrow`] },

  { key: "rsvp.eyebrow", messages: [`${NS}.rsvp.eyebrow`] },
  {
    key: "rsvp.title",
    messages: [`${NS}.rsvp.titleLine1`, `${NS}.rsvp.titleLine2`],
    multiline: true,
  },

  { key: "faq.eyebrow", messages: [`${NS}.faq.eyebrow`] },
  { key: "faq.title", messages: [`${NS}.faq.title`] },

  { key: "footer.eyebrow", messages: [`${NS}.footer.eyebrow`] },
  // The Jour J blocks have no tab of their own: their words are the footer tab's.
  { key: "footer.photosEyebrow", messages: [`${NS}.footer.photosEyebrow`] },
  { key: "footer.photosTitle", messages: [`${NS}.footer.photosTitle`] },
  { key: "footer.photosBody", messages: [`${NS}.footer.photosBody`] },
  { key: "footer.tableEyebrow", messages: [`${NS}.footer.tableEyebrow`] },
  { key: "footer.tableTitle", messages: [`${NS}.footer.tableTitle`] },
  { key: "footer.tableBody", messages: [`${NS}.footer.tableBody`] },
];

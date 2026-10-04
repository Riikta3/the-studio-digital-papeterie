import type { ThemeEditorSlot } from "../types";

/**
 * Every word "Cabo Verde" prints in its own voice and which a couple may
 * rewrite in the editor. Each entry names the catalogue messages that supply
 * the default; the sections read `slot(data, key) ?? t(...)` with the same keys.
 *
 * Defaults are neutral — no place, no date, no couple's turn of phrase. A phrase
 * that holds a date or a place is split: the slot is the wording and the section
 * appends the formatted value ("Jusqu’au" + "30 avril"). The designer's own
 * wording is the showcase's (`demo-data.ts`, `texts`).
 *
 * The hero's stamp, drawn by the stylesheet along the top edge, is a slot too:
 * the root feeds it to the sheet through a custom property.
 */
const NS = "Invitation.caboVerde";

export const caboVerdeEditorSlots: readonly ThemeEditorSlot[] = [
  { key: "hero.stamp", messages: [`${NS}.hero.stamp`] },
  { key: "hero.cta", messages: [`${NS}.hero.cta`] },
  { key: "hero.welcomeEyebrow", messages: [`${NS}.welcome.eyebrow`] },
  {
    key: "hero.welcomeTitle",
    messages: [`${NS}.welcome.titleLine1`, `${NS}.welcome.titleLine2`],
    multiline: true,
  },

  { key: "intro-video.eyebrow", messages: [`${NS}.introVideo.eyebrow`] },

  { key: "gallery.eyebrow", messages: [`${NS}.gallery.eyebrow`] },
  {
    key: "gallery.title",
    messages: [`${NS}.gallery.titleLine1`, `${NS}.gallery.titleLine2`],
    multiline: true,
  },

  { key: "countdown.until", messages: [`${NS}.countdown.until`] },
  {
    key: "countdown.title",
    messages: [`${NS}.countdown.titleLine1`, `${NS}.countdown.titleLine2`],
    multiline: true,
  },
  { key: "countdown.caption", messages: [`${NS}.countdown.caption`] },

  { key: "map.eyebrow", messages: [`${NS}.venue.eyebrow`] },

  { key: "timeline.eyebrow", messages: [`${NS}.itinerary.eyebrow`] },
  { key: "timeline.title", messages: [`${NS}.itinerary.title`] },

  { key: "menu.eyebrow", messages: [`${NS}.menu.eyebrow`] },
  {
    key: "menu.title",
    messages: [`${NS}.menu.titleLine1`, `${NS}.menu.titleLine2`],
    multiline: true,
  },

  { key: "dress-code.eyebrow", messages: [`${NS}.dress.eyebrow`] },

  { key: "accommodation.eyebrow", messages: [`${NS}.stay.eyebrow`] },
  {
    key: "accommodation.title",
    messages: [`${NS}.stay.titleLine1`, `${NS}.stay.titleLine2`],
    multiline: true,
  },

  { key: "playlist.eyebrow", messages: [`${NS}.playlist.eyebrow`] },
  {
    key: "playlist.title",
    messages: [`${NS}.playlist.titleLine1`, `${NS}.playlist.titleLine2`],
    multiline: true,
  },
  { key: "playlist.intro", messages: [`${NS}.playlist.intro`] },

  { key: "transport.eyebrow", messages: [`${NS}.travel.eyebrow`] },
  { key: "transport.title", messages: [`${NS}.travel.title`] },
  // The words on the notebook's stationery: the airline on the pass's stub, the
  // word on the passport's cover.
  { key: "transport.airline", messages: [`${NS}.travel.airline`] },
  { key: "transport.passport", messages: [`${NS}.travel.passport`] },

  { key: "faq.eyebrow", messages: [`${NS}.faq.eyebrow`] },
  {
    key: "faq.title",
    messages: [`${NS}.faq.titleLine1`, `${NS}.faq.titleLine2`],
    multiline: true,
  },

  { key: "gift-list.eyebrow", messages: [`${NS}.gifts.eyebrow`] },

  { key: "rsvp.title", messages: [`${NS}.rsvp.title`] },

  // The guestbook (« livre d'or »): a postcard the guests write to the couple.
  { key: "guestbook.eyebrow", messages: [`${NS}.guestbook.eyebrow`] },
  {
    key: "guestbook.title",
    messages: [`${NS}.guestbook.titleLine1`, `${NS}.guestbook.titleLine2`],
    multiline: true,
  },
  { key: "guestbook.intro", messages: [`${NS}.guestbook.intro`] },
];

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

  { key: "rsvp.title", messages: [`${NS}.rsvp.title`] },
];

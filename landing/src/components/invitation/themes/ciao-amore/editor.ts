import type { ThemeEditorSlot } from "../types";

/**
 * Every word "Ciao Amore" prints in its own voice, and which a couple may
 * rewrite in the editor.
 *
 * Each entry names the catalogue messages that supply the default; the
 * sections read `slot(data, key) ?? t(...)` with the same keys, so a slot
 * listed here and a slot the markup honours are the same thing. Adding a word
 * to this list without wiring it in the section would offer the couple a field
 * that changes nothing — check the preview when you add one.
 *
 * Several defaults were written for the showcase's Amalfi weekend and are
 * wrong for most real weddings — "Deux jours d'exception", "Dress code ·
 * Jour 2", "La musique de notre week-end", the ITALIA stamp. That is the main
 * reason they are slots.
 */
const NS = "Invitation.ciaoAmore";

export const ciaoAmoreEditorSlots: readonly ThemeEditorSlot[] = [
  { key: "hero.cta", messages: [`${NS}.hero.discoverCta`] },

  { key: "countdown.eyebrow", messages: [`${NS}.countdown.eyebrow`] },
  {
    key: "countdown.title",
    messages: [`${NS}.countdown.titleLine1`, `${NS}.countdown.titleLine2`],
    multiline: true,
  },

  { key: "timeline.ribbon", messages: [`${NS}.schedule.ribbon`] },
  { key: "timeline.stamp", messages: [`${NS}.schedule.stamp`] },
  { key: "timeline.introEyebrow", messages: [`${NS}.schedule.introEyebrow`] },
  { key: "timeline.introTitle", messages: [`${NS}.schedule.introTitle`] },
  { key: "timeline.dayOneEyebrow", messages: [`${NS}.schedule.dayOneEyebrow`] },
  { key: "timeline.dayOneTitle", messages: [`${NS}.schedule.dayOneTitle`] },
  // Before each event's dress code, on its card and on the day-after card.
  { key: "timeline.dressLabel", messages: [`${NS}.schedule.dressLabel`] },

  { key: "dress-code.eyebrow", messages: [`${NS}.dressCode.eyebrow`] },

  { key: "map.eyebrow", messages: [`${NS}.venue.eyebrow`] },

  { key: "accommodation.title", messages: [`${NS}.stays.title`] },
  { key: "accommodation.tag", messages: [`${NS}.stays.keyTag`] },

  { key: "playlist.eyebrow", messages: [`${NS}.playlist.eyebrow`] },
  {
    key: "playlist.title",
    messages: [`${NS}.playlist.titleLine1`, `${NS}.playlist.titleLine2`],
    multiline: true,
  },

  { key: "faq.eyebrow", messages: [`${NS}.faq.eyebrow`] },
  {
    key: "faq.title",
    messages: [`${NS}.faq.titleLine1`, `${NS}.faq.titleLine2`],
    multiline: true,
  },

  {
    key: "rsvp.title",
    messages: [`${NS}.rsvp.titleLine1`, `${NS}.rsvp.titleLine2`],
    multiline: true,
  },

  { key: "intro-video.eyebrow", messages: [`${NS}.introVideo.eyebrow`] },
  { key: "menu.eyebrow", messages: [`${NS}.menu.eyebrow`] },
  { key: "menu.title", messages: [`${NS}.menu.title`], multiline: true },
  { key: "gallery.eyebrow", messages: [`${NS}.gallery.eyebrow`] },
  { key: "gallery.title", messages: [`${NS}.gallery.title`], multiline: true },
  { key: "gift-list.eyebrow", messages: [`${NS}.gifts.eyebrow`] },
  // The heading and the welcome words are the couple's own fields (the guestbook tab); these are the
  // theme's defaults under them.
  { key: "guestbook.eyebrow", messages: [`${NS}.guestbook.eyebrow`] },
  {
    key: "guestbook.title",
    messages: [`${NS}.guestbook.titleLine1`, `${NS}.guestbook.titleLine2`],
    multiline: true,
  },
  { key: "guestbook.intro", messages: [`${NS}.guestbook.intro`] },

  // Drawn by the stylesheet (`content:`), fed through custom properties by
  // `CiaoAmoreRoot` — see DECOR_WORDS there.
  { key: "hero.watermark", messages: [`${NS}.decor.heroWatermark`], multiline: true },
  { key: "timeline.introTag", messages: [`${NS}.decor.introTag`] },
  { key: "timeline.archFooter", messages: [`${NS}.decor.archFooter`] },
  { key: "timeline.footer", messages: [`${NS}.decor.timelineFooter`] },
  { key: "playlist.tag", messages: [`${NS}.decor.playlistTag`] },
];

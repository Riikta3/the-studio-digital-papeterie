import { demoDate, demoDayAfter, demoLabel, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

/**
 * Demo content for the "Ciao Amore" theme — Alba & Elio, Villa Cimbrone.
 *
 * Transcribed from the source project, with two corrections to its own
 * inconsistencies:
 *   - the postcard stamp was stamped with a year that did not match the
 *     wedding's; it now reads the year off the date itself;
 *   - the FAQ described the day-2 dress code as "Riviera Chic" while the dress
 *     code section said "Pastel Chic". The section wins; the FAQ follows it.
 *
 * The venue photograph was hotlinked from visitbeautifulitaly.com in the
 * source. It is left out rather than re-hosted without a licence — the theme
 * renders its frame without a photo when `venue.image` is absent.
 *
 * The wedding date rolls: it is always six months out, so the countdown on the
 * showcase never sits at zero. Every label is derived from it rather than
 * written down, so nothing can drift out of step.
 */
const STARTS_AT = demoStartsAt(6, "17:00", "+01:00");
const DAY_TWO = demoDayAfter(6);

export const CIAO_AMORE_DEMO: InvitationData = {
  couple: {
    partner1: "Alba",
    partner2: "Elio",
    monogram: "A & E",
  },

  event: {
    startsAt: STARTS_AT,
    /* Two months before the wedding, as the source's own copy implied. */
    rsvpDeadline: demoDate(4),
    timezone: "Europe/Rome",
  },

  venue: {
    name: "Villa Cimbrone",
    city: "Ravello",
    country: "Italie",
    address: "Via Santa Chiara, 26\n84010 Ravello · Italie",
    wazeUrl:
      "https://www.waze.com/live-map/directions/italy/campania/ravello/hotel-villa-cimbrone?to=place.ChIJAyE35eaSOxMRsCFFoQZvuLQ",
    mapsUrl: "https://maps.google.com/?q=Villa+Cimbrone+Ravello",
  },

  copy: {
    heroKicker: "Ciao Amore",
    announcement: "Nous nous marions…",
    dateLabel: demoLabel.dotted(STARTS_AT),
    dateSpelled: demoLabel.weekday(STARTS_AT),
    scheduleIntro: "Entre ciel bleu, oliviers et éclats de rire.",
    playlistIntro: "Aidez-nous à créer la bande-son de notre mariage.",
    staysIntro: "Sélectionnés pour vous",
    closing: "Grazie !",
    footerNote: "The Studio · Papeterie Digitale",
  },

  schedule: [
    {
      day: 1,
      time: "17 h 00",
      title: "Cérémonie religieuse",
      description: "Quelques mots, beaucoup d'émotion.",
      icon: "church",
      image: "/themes/ciao-amore/program/church.webp",
    },
    {
      day: 1,
      time: "18 h 00",
      title: "Cocktail",
      description: "À votre santé, face à la côte amalfitaine.",
      icon: "spritz",
      image: "/themes/ciao-amore/program/spritz-scene.webp",
    },
    {
      day: 1,
      time: "20 h 30",
      title: "Dîner de mariage",
      description: "À table, dans les jardins de la Villa.",
      icon: "plate",
      image: "/themes/ciao-amore/program/italian-table.webp",
    },
    {
      day: 1,
      time: "23 h 30",
      title: "Fête jusqu'au matin",
      description: "La notte è giovane.",
      icon: "party",
    },
  ],

  dayTwo: {
    dateLabel: `Jour 2 · ${demoLabel.weekday(DAY_TWO)}`,
    title: "Brunch & Pool Party",
    timeLabel: "À partir de 11 h 00",
    body: "Prolongeons les festivités autour d'un brunch ensoleillé. Piscine, transats et douceur de vivre seront au programme.",
    note: "Maillot de bain & serviette indispensables",
  },

  dressCode: {
    title: "Pastel Chic",
    body: "Une palette douce et lumineuse inspirée de la lumière italienne.",
    colors: ["#adcbe4", "#e7bdc6", "#ead46e", "#a9c9b4"],
    note: "Les couleurs pastel, les matières naturelles et les silhouettes élégantes sont les bienvenues.",
    image: "/themes/ciao-amore/dresscode-pastel.webp",
  },

  stays: [
    {
      name: "Hotel Villa Maria",
      distance: "À environ 5 min à pied",
      address: "Via Santa Chiara · Ravello",
      url: "https://www.hotelvillamaria.it",
    },
    {
      name: "Palazzo Avino",
      distance: "À environ 8 min à pied",
      address: "Via San Giovanni del Toro · Ravello",
      url: "https://www.palazzoavino.com",
    },
    {
      name: "Caruso, A Belmond Hotel",
      distance: "À environ 10 min à pied",
      address: "Piazza San Giovanni del Toro · Ravello",
      url: "https://www.belmond.com/hotels/europe/italy/amalfi-coast/belmond-hotel-caruso/",
    },
    { name: "Villa Piedimonte", distance: "environ 12 min", secondary: true },
    { name: "Hotel Giordano", distance: "environ 9 min", secondary: true },
    { name: "Garden Hotel", distance: "environ 10 min", secondary: true },
    { name: "Villa Amore", distance: "environ 4 min", secondary: true },
    { name: "Casa Dolce Casa", distance: "environ 14 min", secondary: true },
  ],

  playlist: [
    { title: "Can't Take My Eyes Off You", artist: "Boys Town Gang" },
    { title: "Sauvignon Blanc", artist: "Rosalía" },
    { title: "Dreams", artist: "Fleetwood Mac" },
  ],

  faq: [
    {
      question: "Quel est le dress code ?",
      answer:
        "Le jour 1, aucun dress code particulier : le blanc est réservé à la mariée, mais les couleurs d'été sont vivement encouragées. Pour le brunch du jour 2, le thème est Pastel Chic, dans les tons bleu ciel, rose poudré, jaune doux et vert d'eau.",
    },
    {
      question: "Quel type de chaussures prévoir ?",
      answer:
        "Une partie du cocktail et du brunch se déroulera sur du gravier, avec également des espaces en pelouse. Prévoyez donc des chaussures adaptées.",
    },
    {
      question: "Le dîner aura-t-il lieu à l'extérieur ?",
      answer: "Le dîner aura lieu à l'intérieur, dans une salle climatisée.",
    },
    {
      question: "Jusqu'à quelle date confirmer ?",
      answer: `Merci de répondre avant le ${demoLabel.long(demoDate(4))}.`,
    },
  ],

  rsvp: {
    allowPartner: true,
    // The demo accepts children so the showcase exercises the fields. The
    // matching FAQ answer is derived from this same flag by
    // `themes/faq.ts` — the entry is deliberately NOT written in the list
    // above, so the two can never disagree.
    allowChildren: true,
    collectMessage: true,
    dietaryOptions: [
      "Aucune restriction",
      "Végétarien",
      "Végan",
      "Sans gluten",
      "Sans lactose",
      "Casher",
      "Allergie ou régime particulier",
    ],
  },

  modules: [
    "countdown",
    "timeline",
    "dress-code",
    "map",
    "accommodation",
    "playlist",
    "faq",
    "rsvp",
  ],
};

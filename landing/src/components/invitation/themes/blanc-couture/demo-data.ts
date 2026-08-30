import { demoDate, demoLabel, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

/**
 * Demo content for the "Blanc Couture" theme — Victoria & Gabriel, Villa
 * Ephrussi de Rothschild.
 *
 * Transcribed from the source project, with its hard-coded values lifted out of
 * the JSX: the hotel city (repeated verbatim in every card), the dress-code
 * palette (pinned in CSS through `.natural-palette i:nth-child(n)`) and the two
 * route links all live here now, so one wedding's content can be swapped
 * without touching a component.
 *
 * The wedding date rolls: it is always six months out, so the countdown on the
 * showcase never sits at zero. Every label is derived from it rather than
 * written down, so nothing can drift out of step.
 *
 * The source spelled the date out in words ("Trente avril / Deux mille
 * vingt-sept") across two lines. Spelling a rolling date would need a
 * number-to-words converter in French, and a wrong spelling on the one section
 * whose whole subject is the date is worse than not spelling it. The weekday
 * label keeps the same two-line typographic pair — `SaveTheDateSection` splits
 * `dateSpelled` on its newline — while staying true to the real date.
 */
const STARTS_AT = demoStartsAt(6, "16:30", "+02:00");

/* Two months before the wedding, as the source's own RSVP note implied. */
const RSVP_DEADLINE = demoDate(4);

/* "samedi 28 février" + "2028": the weekday label broken after the month, so
   the section keeps the stacked pair of lines the design is built around. */
const SPELLED = demoLabel.weekday(STARTS_AT);
const DATE_SPELLED = SPELLED.replace(/ (\d{4})$/, "\n$1");

export const BLANC_COUTURE_DEMO: InvitationData = {
  couple: {
    partner1: "Victoria",
    partner2: "Gabriel",
    monogram: "V & G",
  },

  event: {
    startsAt: STARTS_AT,
    rsvpDeadline: RSVP_DEADLINE,
    timezone: "Europe/Paris",
  },

  venue: {
    name: "Villa Ephrussi de Rothschild",
    city: "Saint-Jean-Cap-Ferrat",
    country: "France",
    mapsUrl: "https://maps.google.com/?q=Villa+Ephrussi+de+Rothschild",
    wazeUrl: "https://www.waze.com/ul?q=Villa%20Ephrussi%20de%20Rothschild",
  },

  copy: {
    heroKicker: "Entourés de leurs familles,",
    announcement: "se marient",
    dateLabel: demoLabel.dotted(STARTS_AT),
    dateSpelled: DATE_SPELLED,
    venueIntro:
      "Une célébration intemporelle surplombant la Méditerranée, au cœur des jardins d’une villa emblématique de la Riviera.",
    scheduleIntro: "Nous serions heureux de célébrer cette journée exceptionnelle à vos côtés.",
    staysIntro: "Nous vous recommandons de réserver votre séjour dès que possible.",
    playlistIntro: "Ajoutez le morceau que vous aimeriez entendre pendant la soirée.",
    rsvpNote: `Merci de répondre avant le ${demoLabel.long(RSVP_DEADLINE)}`,
    closing: "Nous avons hâte de vous retrouver\npour célébrer cette journée à vos côtés.",
    footerNote: "Saint-Jean-Cap-Ferrat",
  },

  schedule: [
    { day: 1, time: "16 h 30", title: "Accueil des invités", icon: "welcome" },
    { day: 1, time: "17 h", title: "Cérémonie", icon: "rings" },
    { day: 1, time: "18 h 30", title: "Cocktail", icon: "glasses" },
    { day: 1, time: "20 h 30", title: "Dîner", icon: "dinner" },
    { day: 1, time: "23 h", title: "Soirée dansante", icon: "music" },
  ],

  dressCode: {
    title: "Élégance Riviera",
    body: "Des matières naturelles, du lin et des coupes élégantes dans des tons sable, pierre, champagne et sauge. L’ivoire est délicatement réservé à la mariée.",
    colors: ["#d8c4a7", "#b9ad9c", "#c6b179", "#9ca28b"],
    note: "Robes longues · Smokings · Tenues estivales raffinées",
    image: "/themes/blanc-couture/dresscode-faceless.webp",
  },

  stays: [
    { name: "Grand-Hôtel du Cap-Ferrat", city: "Saint-Jean-Cap-Ferrat", distance: "8 min" },
    { name: "Royal-Riviera", city: "Saint-Jean-Cap-Ferrat", distance: "6 min" },
    { name: "La Réserve de Beaulieu", city: "Saint-Jean-Cap-Ferrat", distance: "9 min" },
  ],

  faq: [
    {
      question: "À quelle heure arriver ?",
      answer: "Merci d’arriver à 16 h 30. La cérémonie commencera à 17 h.",
    },
    {
      question: "Les enfants sont-ils conviés ?",
      answer: "Nous aimons vos petits, mais cette célébration sera réservée aux adultes.",
    },
    {
      question: "Un transport est-il prévu ?",
      answer:
        "Les informations concernant les navettes depuis Nice seront partagées ultérieurement.",
    },
    {
      question: "Pouvons-nous prendre des photos ?",
      answer:
        "La cérémonie sera déconnectée. Vous pourrez ensuite immortaliser tous vos souvenirs.",
    },
  ],

  rsvp: {
    allowPartner: true,
    collectMessage: false,
    collectWelcomeDinner: true,
    collectBrunch: true,
  },

  modules: [
    "countdown",
    "map",
    "timeline",
    "dress-code",
    "accommodation",
    "transport",
    "playlist",
    "faq",
    "rsvp",
  ],
};

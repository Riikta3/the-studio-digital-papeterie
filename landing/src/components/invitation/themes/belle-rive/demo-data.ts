import { demoDate, demoDayAfter, demoLabel, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

import type { CarpoolTrip } from "./types";

/**
 * Demo content for "Belle Rive" — Émilie & Jordy, Domaine de la Trinité.
 *
 * Transcribed from the source project. Two things changed on the way in:
 *
 *  - The source paired each timeline entry with its video by array index
 *    (`i === 0 && <Media name="ceremony.mp4" />`), so reordering the programme
 *    silently reassigned the footage. The video now travels on the entry.
 *  - The carpool trips came from a live D1 database and each carried a guest's
 *    phone number, rendered as a `wa.me/` link. The API is not ported and the
 *    sample trips below carry no contact details at all — see
 *    `sections/CarpoolSection.tsx`.
 *
 * The wedding date rolls: it is always six months out, so the countdown on the
 * showcase never sits at zero. Every label — the hero's dotted date, the two
 * day headings, the RSVP deadline quoted in both the RSVP copy and the FAQ, and
 * the carpool departure dates — is derived from these two constants rather than
 * written down, so nothing can drift out of step with the rolling date.
 */
const STARTS_AT = demoStartsAt(6, "17:00", "+02:00");
const DAY_TWO = demoDayAfter(6);
/* Two months before the wedding, as the source's own copy implied. */
const RSVP_DEADLINE = demoDate(4);

export const BELLE_RIVE_DEMO: InvitationData = {
  couple: {
    partner1: "Émilie",
    partner2: "Jordy",
    monogram: "É & J",
  },

  event: {
    startsAt: STARTS_AT,
    rsvpDeadline: RSVP_DEADLINE,
    timezone: "Europe/Paris",
  },

  venue: {
    name: "Domaine de la Trinité",
    city: "Mauguio",
    country: "France",
    address: "Domaine de la Trinité\n34130 Mauguio",
    image: "/themes/belle-rive/domaine.webp",
    wazeUrl: "https://www.waze.com/ul?q=Domaine%20de%20la%20Trinit%C3%A9%2034130%20Mauguio",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Domaine+de+la+Trinit%C3%A9+34130+Mauguio",
  },

  copy: {
    announcement: "Nous nous marions…",
    dateLabel: demoLabel.dotted(STARTS_AT),
    scheduleIntro: "Deux jours d’exception",
    playlistIntro:
      "Proposez-nous le morceau que vous aimeriez entendre et danser avec nous le soir du mariage.",
    staysIntro:
      "Quelques adresses choisies autour du Domaine de la Trinité. Les réservations sont à effectuer directement auprès des établissements, sous réserve de disponibilité.",
    rsvpIntro: "Nous serions honorés de vous compter parmi nous.",
    closing: "Merci !",
    footerNote: "The Studio · Papeterie Digitale",
  },

  schedule: [
    {
      day: 1,
      time: "17H00",
      title: "Cérémonie laïque",
      description: "Un moment d’émotion, entourés de ceux que nous aimons",
      icon: "heart",
      image: "/themes/belle-rive/ceremony.mp4",
    },
    {
      day: 1,
      time: "18H00",
      title: "Cocktail",
      description: "Bulles, musique et retrouvailles",
      icon: "cheers",
      image: "/themes/belle-rive/cocktails.mp4",
    },
    {
      day: 1,
      time: "20H30",
      title: "Dîner de mariage",
      description: "À table pour célébrer ensemble",
      icon: "cutlery",
      image: "/themes/belle-rive/reception.mp4",
    },
    {
      day: 1,
      time: "23H30",
      title: "Fête jusqu’au matin",
      description: "Place à la danse et aux souvenirs",
      icon: "music",
    },
  ],

  dayTwo: {
    dateLabel: demoLabel.weekday(DAY_TWO),
    title: "Brunch & Pool Party",
    timeLabel: "À PARTIR DE 11H00",
    body: "Retrouvons-nous autour d’un brunch ensoleillé. Piscine, tennis et pétanque seront à votre disposition pour ceux qui souhaitent en profiter.",
    note: "Maillot de bain & serviette indispensables",
    image: "/themes/belle-rive/brunch-table.webp",
  },

  dressCode: {
    title: "Riviera Chic",
    body: "Pour prolonger les festivités dans une ambiance lumineuse et élégante, nous vous invitons à porter une tenue dans les tons :",
    // Labels and swatches are paired positionally by the section, matching the
    // source's `.palette span:nth-child(n)` rules.
    colors: ["white", "#eee7d9", "#d8c5a6"],
    note: "N’oubliez pas votre maillot de bain et votre serviette !",
    image: "/themes/belle-rive/dresscode-riviera.webp",
  },

  stays: [
    // Partner offers — rendered as the large framed cards.
    {
      name: "Horizon Resort Massane",
      distance: "Baillargues · 10 min du domaine",
      offer: "–10 % avec le code DOMAINETRINITE",
      address: "Hôtel, appartements, villa, spa & golf",
      url: "https://www.horizon-resort.com/fr/",
    },
    {
      name: "Ibis Budget Montpellier Aéroport",
      distance: "Mauguio · à proximité du domaine",
      offer: "–15 % en mentionnant Domaine de la Trinité",
      address: "Tarif flexible, sous réserve de disponibilité",
      url: "https://all.accor.com/hotel/B4T1/index.fr.shtml",
    },
    {
      name: "Ibis Styles Montpellier Aéroport",
      distance: "Mauguio · à proximité du domaine",
      offer: "–15 % en mentionnant Domaine de la Trinité",
      address: "Tarif flexible, sous réserve de disponibilité",
      url: "https://all.accor.com/hotel/B4T1/index.fr.shtml",
    },

    // Gîtes and houses nearby — the always-visible list.
    {
      name: "Airbnb des Garrigues · 4 pers.",
      distance: "À 100 m · séjour minimum de 7 jours",
      url: "https://www.airbnb.fr/rooms/1186090359342700261",
    },
    {
      name: "Airbnb des Garrigues · 6 pers.",
      distance: "À 100 m · séjour minimum de 7 jours",
      url: "https://www.airbnb.fr/rooms/1081730118956181271",
    },
    {
      name: "L’Atelier des Vidaux",
      distance: "Saint-Aunès · 8 min · jusqu’à 7 pers.",
      url: "https://www.atelier-des-vidaux.fr/",
    },
    {
      name: "Gîte du Réservoir",
      distance: "Mauguio · 10 min · 3 logements de 4 pers.",
      url: "https://www.gitesdureservoir.com/",
    },
    {
      name: "Villa Cocoon",
      distance: "Mauguio · 10 min · jusqu’à 6 pers.",
      url: "https://www.instagram.com/villa_cocoon_34",
    },
    {
      name: "Gîtes des Coquilloux",
      distance: "Castelnau-le-Lez · 10 min",
      url: "https://gitelescoquilloux.com/",
    },

    // Everything else, behind the "voir plus d’options" disclosure.
    {
      name: "Domaine de Verchant",
      distance: "10 min du domaine",
      url: "https://www.domainedeverchant.com/",
      secondary: true,
    },
    {
      name: "Plage Palace",
      distance: "10 min du domaine",
      url: "https://www.plagepalace.com/",
      secondary: true,
    },
    {
      name: "Richer de Belleval",
      distance: "20 min du domaine",
      url: "https://www.hotel-richerdebelleval.com/",
      secondary: true,
    },
    {
      name: "Domaine de Biar",
      distance: "25 min du domaine",
      url: "https://www.domainedebiar.com/",
      secondary: true,
    },
    {
      name: "Grand Hôtel du Midi",
      distance: "20 min du domaine",
      url: "https://www.grandhoteldumidimontpellier.com/fr/hotel",
      secondary: true,
    },
    {
      name: "Courtyard by Marriott",
      distance: "10 min du domaine",
      url: "https://www.marriott.com/fr/hotels/mplcy-courtyard-montpellier/overview/",
      secondary: true,
    },
    {
      name: "Pullman La Pléiade",
      distance: "10 min du domaine",
      url: "https://all.accor.com/hotel/1294/index.fr.shtml",
      secondary: true,
    },
    {
      name: "Greet Hôtel Aéroport",
      distance: "8 min du domaine",
      url: "https://all.accor.com/hotel/B7P5/index.fr.shtml",
      secondary: true,
    },
    {
      name: "Oceania Le Métropole",
      distance: "20 min du domaine",
      url: "https://www.oceaniahotels.com/oceania-montpellier",
      secondary: true,
    },
    {
      name: "Mercure Montpellier Centre Comédie",
      distance: "10 min du domaine",
      url: "https://all.accor.com/hotel/3043/index.fr.shtml",
      secondary: true,
    },
    {
      name: "Lagrange Apart’Hôtel",
      distance: "10 min du domaine",
      url: "https://www.booking.com/hotel/fr/lagrange-city-residence-du-chateau.fr.html",
      secondary: true,
    },
    {
      name: "Forme Hôtel",
      distance: "10 min du domaine",
      url: "https://www.forme-hotel.com/",
      secondary: true,
    },
    {
      name: "Best Western Plus Comédie Saint-Roch",
      distance: "15 min du domaine",
      url: "https://www.bestwestern.fr/fr/hotel-Montpellier-Best-Western-Plus-Comedie-Saint-Roch-93822",
      secondary: true,
    },
    {
      name: "Hôtel d’Aragon",
      distance: "15 min du domaine",
      url: "https://www.hotel-aragon.fr/",
      secondary: true,
    },
  ],

  playlist: [
    { title: "Can’t Take My Eyes Off You", artist: "Boys Town Gang" },
    { title: "Sauvignon Blanc", artist: "Rosalía" },
    { title: "Dreams", artist: "Fleetwood Mac" },
  ],

  faq: [
    {
      question: "Les enfants sont-ils conviés ?",
      answer:
        "Afin que tous les parents puissent profiter pleinement de la soirée et faire la fête jusqu’au bout de la nuit, notre mariage se déroulera entre adultes. Les invités de moins de 18 ans ne seront donc pas conviés. Nous espérons que vous comprendrez ce choix et profiterez de cette parenthèse rien que pour vous.",
    },
    {
      question: "Quel est le dress code ?",
      answer:
        "Pour le jour 1, aucun dress code particulier : le blanc est évidemment réservé à la mariée, mais nous vous encourageons à porter de jolies couleurs d’été. Pour le brunch du jour 2, le thème sera Riviera Chic, dans les tons blanc, écru et beige.",
    },
    {
      question: "Que faut-il prévoir pour le brunch ?",
      answer:
        "Votre maillot de bain et votre serviette pour profiter de la piscine, du tennis et de la pétanque.",
    },
    {
      question: "Comment venir en train ?",
      answer:
        "• Depuis Paris : environ 3 h 30 de TGV.\n• Gare Montpellier Sud de France : à 5 min du domaine.\n• Gare Montpellier Saint-Roch : à 15 min du domaine.\n• Puis taxi, VTC ou covoiturage.",
    },
    {
      question: "Quel est l’aéroport le plus proche ?",
      answer:
        "• Aéroport Montpellier-Méditerranée.\n• Vol direct Paris–Montpellier : environ 1 h 20 à 1 h 25.\n• À 5 min du domaine en voiture.\n• Puis taxi, VTC ou covoiturage.",
    },
    {
      question: "Jusqu’à quand puis-je répondre ?",
      answer: `Merci de confirmer votre présence au plus tard le ${demoLabel.long(RSVP_DEADLINE)}.`,
    },
  ],

  rsvp: {
    allowPartner: true,
    collectMessage: true,
    dietaryOptions: [
      "Aucune restriction",
      "Végétarien",
      "Végan",
      "Sans gluten",
      "Sans lactose",
      "Casher",
      "Allergie aux crustacés",
      "Allergie aux fruits à coque",
      "Allergie aux arachides",
      "Autre",
    ],
  },

  modules: [
    "countdown",
    "map",
    "timeline",
    "dress-code",
    "accommodation",
    "playlist",
    "faq",
    "rsvp",
    "gift-list",
  ],
};

/**
 * Sample carpool trips.
 *
 * Carpooling is not a `ModuleId`, so it cannot live on `InvitationData` without
 * changing the shared contract — it is exported separately and the manifest
 * hands it to the root. Deliberately no phone numbers: the section renders an
 * inert "Contacter" button, never a `wa.me/` link.
 *
 * Every trip departs on the wedding day, so these follow the rolling date too —
 * a trip dated before the wedding it drives to would read as stale demo data.
 */
export const BELLE_RIVE_DEMO_TRIPS: CarpoolTrip[] = [
  {
    id: 1,
    name: "Camille",
    departure: "Paris",
    travelDate: demoDate(6),
    travelTime: "07:30",
    seats: 3,
    returnTrip: true,
  },
  {
    id: 2,
    name: "Thomas",
    departure: "Lyon",
    travelDate: demoDate(6),
    travelTime: "09:00",
    seats: 2,
    returnTrip: false,
  },
  {
    id: 3,
    name: "Sofia",
    departure: "Toulouse",
    travelDate: demoDate(6),
    travelTime: "11:15",
    seats: 1,
    returnTrip: true,
  },
];

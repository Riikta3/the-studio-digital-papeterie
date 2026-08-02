import { assets } from "@/components/invitation/theme-mediterranean-classy/tokens";

/**
 * Demo dataset for the "Mediterranean Classy" theme.
 *
 * The Figma mock carries five contradictory dates and an address that does not
 * match its own map, so the placeholder copy was reconciled here: the wedding
 * runs 12–13 June 2027 (the programme's own dates), the RSVP deadline and the
 * footer follow from it, and the venue sits in the Alpes-Maritimes where the
 * map places it. See STRUCTURE.md for the full list of discrepancies.
 */

export type TimelineEntry = {
  time: string;
  label: string;
  image: string;
  /** Cut-out illustration: rendered without the full-bleed watercolour framing. */
  cutout?: boolean;
};

export type ProgrammeDay = {
  title: string;
  date: string;
  entries: TimelineEntry[];
};

export type Accommodation = {
  name: string;
  city: string;
  distance: string;
  image: string;
  bookingCode?: string;
};

export type FaqEntry = { question: string; answer: string };

export type PlaylistSuggestion = { title: string; artist: string };

export const MEDITERRANEAN_DEMO = {
  partner1: "Emilie",
  partner2: "Jordy",

  /** Ceremony day — drives the countdown, the hero and the footer. */
  weddingDateISO: "2027-06-12",
  weddingDateLabel: "Le 12 juin 2027",

  intro: "Nous nous marions …",

  venue: {
    name: "Domaine de la Trinité",
    address: "Route de la Trinité, 06340 La Trinité",
    mapImage: assets.mapDomaineTrinite,
    wazeUrl: "https://waze.com/ul?q=Domaine%20de%20la%20Trinit%C3%A9%20La%20Trinit%C3%A9",
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Domaine+de+la+Trinit%C3%A9+La+Trinit%C3%A9",
    access: [
      { mode: "En voiture", details: ["à 25 min de Nice", "20 min de Cannes"] },
      {
        mode: "En avion",
        details: ["Aéroport Nice Côte d'Azur (NCE)", "Puis transfert privé possible"],
      },
    ],
  },

  programme: [
    {
      title: "Jour 1",
      date: "Samedi 12 juin 2027",
      entries: [
        { time: "17H00", label: "Cérémonie laïque", image: assets.venueCeremonyArch },
        { time: "19H30", label: "Cocktail", image: assets.iconCocktails, cutout: true },
        { time: "21H30", label: "Dîner de mariage", image: assets.venueBanquetTable },
        { time: "23H30", label: "Fête jusqu'au matin", image: assets.venueOrangerie },
      ],
    },
    {
      title: "Jour 2",
      date: "Dimanche 13 juin 2027",
      entries: [
        { time: "12H00", label: "Brunch pool party", image: assets.venuePool },
        { time: "15H00", label: "Pétanque et tennis", image: assets.venuePetanque },
      ],
    },
  ] satisfies ProgrammeDay[],

  accommodations: [
    {
      name: "Le Mas Candille",
      city: "Mougins",
      distance: "10 min du domaine",
      image: assets.photoHotelPool,
      bookingCode: "EJ2027",
    },
    {
      name: "La Bastide Saint-Antoine",
      city: "Grasse",
      distance: "20 min du domaine",
      image: assets.photoHotelPool,
      bookingCode: "EJ2027",
    },
  ] satisfies Accommodation[],

  playlist: {
    intro: "Aidez-nous à créer la bande-son de notre week-end",
    suggestions: [
      { title: "Can't Take My Eyes Off You", artist: "Boys Town Gang" },
      { title: "Sauvignon Blanc", artist: "Rosalía" },
      { title: "Dreams", artist: "Fleetwood Mac" },
    ] satisfies PlaylistSuggestion[],
  },

  faq: [
    {
      question: "Puis-je modifier mon site après l'envoi des invitations ?",
      answer:
        "Absolument ! C'est la magie du digital. Vous pouvez modifier les horaires, ajouter des infos sur l'hébergement ou changer une photo à tout moment. Vos invités verront toujours la version à jour.",
    },
    {
      question: "Est-ce que je dois payer un abonnement mensuel ?",
      answer:
        "Non. Vous payez une fois, et votre site reste en ligne jusqu'à un an après la date de votre mariage.",
    },
    {
      question: "Comment mes invités confirment-ils leur présence (RSVP) ?",
      answer:
        "Directement depuis le site, en quelques secondes. Vous recevez chaque réponse par email et retrouvez la liste complète dans votre tableau de bord.",
    },
    {
      question: "Puis-je avoir un nom de domaine personnalisé ?",
      answer:
        "Oui. Vous pouvez utiliser une adresse du type emilie-et-jordy.fr, ou connecter un nom de domaine que vous possédez déjà.",
    },
    {
      question: "Proposez-vous des faire-part papier assortis ?",
      answer:
        "Oui, chaque thème existe en version imprimée, avec les mêmes papiers gaufrés et les mêmes typographies que votre site.",
    },
  ] satisfies FaqEntry[],

  rsvp: {
    intro:
      "Nous serions honorés de vous compter parmi nous. Merci de bien vouloir confirmer votre présence avant le 14 mars 2027.",
    deadlineLabel: "Merci de répondre avant le 14 mars 2027",
    attendance: [
      "Oui, je serai là avec grand plaisir",
      "Non, mais je penserai fort à vous",
    ],
    party: ["Moi uniquement", "Moi + mon/ma partenaire"],
    dietaryOptions: ["Aucune", "Végétarien", "Végétalien", "Sans gluten", "Halal"],
  },

  footer: {
    title: "Merci !",
    image: assets.venueDomaineTrinite,
  },
} as const;

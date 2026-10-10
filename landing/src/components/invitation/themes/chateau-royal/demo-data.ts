import { demoDate, demoDayAfter, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";
import { DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";

/**
 * The showcase wedding of "Château Royal": the designer's own, kept whole. The
 * only file of the theme that may name the demo couple, the demo venue and the
 * dishes.
 */

const STARTS_AT = demoStartsAt(5, "15:30", "+02:00");
const WEDDING_DAY = demoDate(5);
const DAY_AFTER = demoDayAfter(5);

export const CHATEAU_ROYAL_DEMO: InvitationData = {
  couple: { partner1: "Éléonore", partner2: "Raphaël", monogram: "E & R" },
  event: { startsAt: STARTS_AT, rsvpDeadline: demoDate(3), timezone: "Europe/Paris" },
  venue: {
    name: "Château de Vaux-le-Vicomte",
    city: "Maincy",
    country: "France",
    address: "77950 Maincy",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ch%C3%A2teau+de+Vaux-le-Vicomte",
    image: "/themes/chateau-royal/chateau-aerien.webp",
    access: [
      {
        mode: "Covoiturage",
        details: ["Une place libre ou un trajet à partager ? Indiquez-le dans les précisions de votre réponse."],
      },
    ],
  },
  copy: {
    closing: "Merci d’être là, vraiment.",
    footerNote: "Avec toute notre affection",
    staysIntro: "Quelques adresses autour du château, à quelques minutes des jardins.",
    playlistIntro: "Une valse, un classique, un titre qui vous fera quitter votre chaise : notez-le, nous l’ajouterons au bal.",
  },
  schedule: [
    { day: 1, time: "15 h 30", title: "La cérémonie", description: "Dans les jardins", icon: "ceremony", event: "wedding-day" },
    { day: 1, time: "17 h 00", title: "Le cocktail", description: "Sur la terrasse", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "19 h 30", title: "Le dîner", description: "Dans la grande galerie", icon: "dinner", event: "wedding-day" },
    { day: 1, time: "22 h 30", title: "La première danse", description: "Sous les lustres", icon: "party", event: "wedding-day" },
    { day: 1, time: "Jusqu’à l’aube", title: "Le bal", description: "La nuit est à nous", event: "wedding-day" },
  ],
  events: [
    { kind: "wedding-day", name: "Le grand jour", date: WEDDING_DAY, time: "15 h 30", day: 1 },
    { kind: "brunch", name: "Le banquet du lendemain", date: DAY_AFTER, time: "11 h 30", day: 2 },
  ],
  dayTwo: {
    title: "Le banquet\ndu lendemain",
    timeLabel: "À partir de 11 h 30",
    body: "Un dernier moment ensemble, au jardin.",
  },
  // The designer's card has no swatches; they are here so the showcase draws them.
  dressCode: {
    title: "Tenue",
    body: "Tenue de soirée, couleur bienvenue.",
    colors: ["#583b32", "#b89768", "#8a9a7b", "#b5654f"],
  },
  menu: {
    sections: [
      { title: "Pour commencer", items: [{ title: "Raviole de langoustine", description: "Bisque légère" }] },
      { title: "À suivre", items: [{ title: "Volaille de Bresse", description: "Jus aux morilles, légumes de saison" }] },
      { title: "Pour finir", items: [{ title: "La pièce montée" }] },
    ],
  },
  faq: [{ question: "Pour la soirée", answer: "Prévoyez une petite laine pour les jardins." }],
  stays: [
    {
      name: "Hôtel de l’Orangerie",
      city: "Maincy",
      address: "2 rue du Grand Parterre",
      distance: "5 min",
      offer: "Tarif mariage jusqu’au mois précédent",
      bookingCode: "ER2027",
      url: "https://hotel-orangerie.example.org",
      image: "/themes/chateau-royal/stay-hotel.webp",
    },
    {
      name: "Le Relais des Écuries",
      city: "Melun",
      address: "14 quai de la Reine-Blanche",
      distance: "12 min",
      phone: "01 64 00 00 00",
    },
    {
      name: "La Bergerie du Parc",
      city: "Maincy",
      address: "Chemin des Charmilles",
      distance: "8 min",
      offer: "Chambres d’hôtes, petit-déjeuner compris",
    },
    { name: "Hôtel du Pont-Neuf", city: "Melun", distance: "15 min", secondary: true },
    { name: "Domaine des Tilleuls", city: "Vaux-le-Pénil", distance: "18 min", secondary: true },
  ],
  playlist: [
    { title: "Le Beau Danube bleu", artist: "Johann Strauss II" },
    { title: "La Bohème", artist: "Charles Aznavour" },
    { title: "September", artist: "Earth, Wind & Fire" },
  ],
  gallery: {
    images: [
      "/themes/chateau-royal/gallery-facade.webp",
      "/themes/chateau-royal/gallery-jardins.webp",
      "/themes/chateau-royal/gallery-table.webp",
      "/themes/chateau-royal/gallery-nuit.webp",
      "/themes/chateau-royal/gallery-chaises.webp",
      "/themes/chateau-royal/gallery-reflet.webp",
    ],
  },
  gifts: {
    title: "Votre présence est notre plus beau cadeau",
    body: "Si vous souhaitez tout de même nous gâter, une urne vous attendra dans la grande galerie, et une cagnotte est ouverte pour notre voyage de noces à Venise.",
    url: "https://cagnotte.example.org/eleonore-raphael",
    linkLabel: "Participer à notre voyage de noces",
  },
  rsvp: { allowPartner: true, allowChildren: true, collectMessage: true, dietaryOptions: [...DIETARY_OPTIONS_FR] },
  // The designer's own wording, kept for the showcase. A real wedding gets the
  // neutral catalogue default until the couple rewrites it.
  texts: {
    "hero.letterTitle": "Deux jours\npour se souvenir",
    "map.title": "Un château,\nnotre histoire",
    "menu.title": "Le menu\nroyal",
  },
  // No intro video: no film fits the showcase. The `heavy` fixture carries one.
};

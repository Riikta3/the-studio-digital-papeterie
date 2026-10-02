import { demoDate, demoDayAfter, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

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
  copy: { closing: "Merci d'être là, vraiment.", footerNote: "Avec toute notre affection" },
  schedule: [
    { day: 1, time: "15 h 30", title: "La cérémonie", description: "Dans les jardins", icon: "ceremony", event: "wedding-day" },
    { day: 1, time: "17 h 00", title: "Le cocktail", description: "Sur la terrasse", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "19 h 30", title: "Le dîner", description: "Dans la grande galerie", icon: "dinner", event: "wedding-day" },
    { day: 1, time: "22 h 30", title: "La première danse", description: "Sous les lustres", icon: "party", event: "wedding-day" },
    { day: 1, time: "Jusqu'à l'aube", title: "Le bal", description: "La nuit est à nous", event: "wedding-day" },
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
  rsvp: { allowPartner: true, allowChildren: true, collectMessage: true },
  // The designer's own wording, kept for the showcase. A real wedding gets the
  // neutral catalogue default until the couple rewrites it.
  texts: {
    "hero.letterTitle": "Deux jours\npour se souvenir",
    "map.title": "Un château,\nnotre histoire",
    "menu.title": "Le menu\nroyal",
  },
};

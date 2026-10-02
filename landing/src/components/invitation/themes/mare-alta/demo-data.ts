import { demoDate, demoDayAfter, demoStartsAt } from "../demo-date";
import { CHILDREN_FAQ_ID } from "../faq";
import type { InvitationData } from "../types";

/**
 * The showcase wedding of "Maré Alta": the designer's own, kept whole.
 *
 * This is the only file of the theme that may name the demo couple, the demo
 * venue and the places around it. Real weddings never read it.
 *
 * The date rolls (always six months out) and every label is derived from it, so
 * the countdown never sits at zero and nothing drifts out of step. The designer
 * wrote "19 juin 2027" and "21 h 04" in several places; none of it is kept as
 * text.
 */

const STARTS_AT = demoStartsAt(6, "17:00", "+01:00");
const WEDDING_DAY = demoDate(6);

/** The day before `WEDDING_DAY`, for the welcome dinner. */
function dayBefore(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export const MARE_ALTA_DEMO: InvitationData = {
  couple: { partner1: "Sienna", partner2: "Malo", monogram: "S · M" },
  event: { startsAt: STARTS_AT, rsvpDeadline: demoDate(4), timezone: "Europe/Lisbon" },
  venue: {
    name: "Casa Maré Alta",
    city: "Comporta",
    country: "Portugal",
    address: "Estrada da Praia, 7580-680 Comporta, Portugal",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Comporta%20Portugal",
    access: [
      { mode: "Arriver", details: ["Lisbonne", "Aéroport Humberto Delgado, puis 1 h 20 de route."] },
      {
        mode: "Rejoindre",
        details: ["Transfert privé", "Départs groupés vendredi et samedi sur réservation."],
        link: { url: "https://transferts.example.org/sienna-malo", label: "Réserver un transfert" },
      },
      { mode: "Prévoir", details: ["24° en juin", "Du soleil la journée et une étole légère après minuit."] },
      { mode: "Prolonger", details: ["Les pieds dans le sable", "Nos plages, tables et balades préférées autour de Comporta."] },
    ],
  },
  copy: {
    heroKicker: "Nous nous marions",
    venueIntro: "Une maison blanche cachée entre les rizières, les dunes et l’océan.",
    scheduleIntro: "Une journée en cinq chapitres, pensée comme une promenade de la lumière vers les étoiles.",
    staysIntro: "Trois maisons entre pins et sable, toutes desservies par la navette.",
    rsvpIntro: "Nous avons hâte de vivre ce week-end au Portugal avec vous.",
    playlistIntro: "Ajoutez le titre que vous voulez absolument entendre pendant la soirée.",
    closing: "Merci d’être là.",
    footerNote: "Avec tout notre amour",
  },
  schedule: [
    { day: 1, time: "16:45", title: "Le jardin s’éveille", description: "Accueil sous les pins, eau fraîche et premiers embruns", event: "wedding-day" },
    { day: 1, time: "17:00", title: "Nos oui face à l’océan", description: "Une cérémonie entourée de nos familles et de nos amis", icon: "ceremony", event: "wedding-day" },
    { day: 1, time: "18:15", title: "Le jardin en fête", description: "Porto tonic, bouchées atlantiques et musique live", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "20:30", title: "À la grande table", description: "Un dîner portugais éclairé par cent bougies", icon: "dinner", event: "wedding-day" },
    { day: 1, time: "23:30", title: "Sous les étoiles", description: "Notre première danse, puis la vôtre jusqu’au matin", icon: "party", event: "wedding-day" },
    // The moments of the two other events, printed under them.
    { day: 1, time: "20:00", title: "Tables en terrasse", description: "Poisson grillé et vin blanc, les pieds dans le sable", icon: "dinner", event: "welcome-dinner" },
    { day: 1, time: "22:30", title: "Feu de camp sur la plage", event: "welcome-dinner" },
    { day: 2, time: "11:30", title: "Brunch au jardin", icon: "brunch", event: "brunch" },
    { day: 2, time: "14:00", title: "Bain de mer et siestes", event: "brunch" },
  ],
  events: [
    { kind: "welcome-dinner", name: "Welcome dinner", date: dayBefore(WEDDING_DAY), time: "20:00", address: "Terrasse de la Casa Maré Alta", description: "Une table commune pour se retrouver la veille.", day: 1 },
    { kind: "wedding-day", name: "Le mariage", date: WEDDING_DAY, time: "16:45", day: 1 },
    { kind: "brunch", name: "Brunch", date: demoDayAfter(6), time: "11:30", address: "Jardin de la Casa Maré Alta", description: "Un dernier moment ensemble, au jardin.", dressCode: "Lin et pieds nus", day: 2 },
  ],
  // The brunch again, as the mapper hands it over: the event's own fields, plus
  // the note the couple wrote on the programme tab.
  dayTwo: {
    title: "Brunch",
    timeLabel: "11:30",
    body: "Un dernier moment ensemble, au jardin.",
    note: "Prévoyez un maillot pour la plage.",
  },
  dressCode: {
    title: "Élégance au jardin",
    body: "Habillez-vous pour un dîner d’été portugais : chic, fluide et lumineux.",
    colors: ["#8a9a7b", "#f3ecdd", "#b8a6c9"],
    note: "On aime les volumes fluides, le lin qui vit, les bijoux sculpturaux, les couleurs du jardin et les détails précieux.\n\nOn évite le total look blanc. Pour le reste : venez spectaculaire, mais venez vous-même.",
  },
  stays: [
    { name: "Villa Pinhal", city: "Comporta", address: "Rua dos Pinhais 12", distance: "7 min", bookingCode: "SIENNA", url: "https://villa-pinhal.example.org" },
    { name: "Casa Areia", city: "Carvalhal", address: "Rua da Areia 4", distance: "11 min", offer: "-10 % avant mars", phone: "+351 265 000 111" },
    { name: "Cabana do Sal", city: "Comporta", address: "Caminho do Sal 2", distance: "14 min", offer: "Dernières disponibilités" },
  ],
  menu: {
    sections: [
      { title: "Ouverture", items: [{ title: "Tomate cœur de bœuf, pêche blanche, huile fumée" }] },
      { title: "De l’Atlantique", items: [{ title: "Bar sauvage, riz de Comporta, beurre au citron confit" }] },
      { title: "De l’Alentejo", items: [{ title: "Agneau aux herbes ou courge rôtie, jus au romarin" }] },
      { title: "Le jardin sucré", items: [{ title: "Figue, fleur d’oranger et glace au lait d’amande" }] },
    ],
    note: "Toutes les allergies et préférences sont recueillies dans le RSVP.",
  },
  gifts: {
    title: "Si le cœur vous en dit",
    body: "Pour celles et ceux qui souhaitent participer à notre prochain chapitre, une cagnotte est ouverte pour notre voyage de noces au Japon : Kyoto, Naoshima, Yakushima.",
    url: "https://cagnotte.example.org/sienna-malo",
    linkLabel: "Participer à notre voyage de noces",
  },
  faq: [
    // Keeps the designer's wording. The `id` tells `withChildrenPolicyFaq` this
    // is the couple's own answer, so the derived one is not added beside it.
    { id: CHILDREN_FAQ_ID, question: "Les enfants sont-ils invités ?", answer: "Oui. Indiquez simplement leur prénom dans votre RSVP afin que nous préparions leur place et leur repas." },
    { question: "Comment venir depuis Lisbonne ?", answer: "Comporta se trouve à environ 1 h 20 de Lisbonne. Retrouvez les options de transfert et de navette dans notre carnet de voyage." },
    { question: "Y aura-t-il une navette ?", answer: "Une navette fera deux départs depuis le centre de Comporta à 16 h 10 et 16 h 35, puis des retours à 1 h, 2 h 30 et 4 h." },
    { question: "Puis-je modifier mon RSVP ?", answer: "Écrivez-nous avant la date limite et nous mettrons à jour vos réponses, accompagnants ou allergies." },
    { question: "Quel sera le sol sur place ?", answer: "La cérémonie et le dîner se déroulent sur un sol naturel et sablonneux. Les talons larges, sandales et mocassins sont vos meilleurs alliés." },
  ],
  playlist: [
    { title: "O Sol", artist: "Vitor Kley" },
    { title: "Manga", artist: "Mayra Andrade" },
    { title: "Boa Sorte", artist: "Vanessa da Mata" },
    { title: "Sodade", artist: "Cesária Évora" },
  ],
  rsvp: {
    allowPartner: true,
    allowChildren: true,
    dietaryOptions: ["Aucun régime particulier", "Végétarien", "Vegan", "Sans gluten", "Sans lactose"],
    collectMessage: true,
  },
  // The designer's own wording, kept for the showcase. A real wedding gets the
  // neutral catalogue default until the couple rewrites it.
  texts: {
    "countdown.note": "Le soleil se couche à 21 h 04. Soyez là avant lui.",
    "timeline.sign": "L’Atlantique donne le rythme",
    "transport.title": "Quelques jours\nau Portugal",
    "transport.intro": "L’arrivée fait déjà partie de la fête. Voici l’essentiel pour voyager léger jusqu’à Comporta.",
    "menu.eyebrow": "Casa Maré Alta · Table d’un soir",
  },
  // Renders the two Jour J blocks. There is no `weddingId`, so they are inert.
  dayOf: { slug: "demo", photos: true },
};

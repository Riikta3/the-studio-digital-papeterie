import { demoDate, demoDayAfter, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";

/**
 * Two control datasets for checking that a theme is variable.
 *
 * A theme is easy to build around its own demo and quietly keep the demo
 * couple's words, counts and photographs. These two weddings share nothing with
 * the demos — not a name, not a place, not a tone — and are rendered by the demo
 * route (`?fixture=minimal|heavy`, never in production) and by `themes:shoot`.
 *
 * - `MINIMAL_WEDDING` is the least a couple can have: names, a date, a venue
 *   name. Every optional field is empty, so every section must degrade.
 * - `HEAVY_WEDDING` is the most: many entries, long strings, three events, an
 *   adults-only RSVP, every optional field filled.
 *
 * Both are demos: no `weddingId`, so no form writes anything.
 */

const STARTS_AT = demoStartsAt(5, "15:30", "+02:00");

/** An inline picture, so the datasets need no files on disk. */
function picture(label: string, hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500"><rect width="1200" height="1500" fill="hsl(${hue} 28% 70%)"/><circle cx="600" cy="620" r="260" fill="hsl(${hue} 30% 82%)"/><text x="600" y="1330" font-family="Georgia,serif" font-size="64" text-anchor="middle" fill="hsl(${hue} 30% 22%)">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MINIMAL_WEDDING: InvitationData = {
  couple: { partner1: "Léa", partner2: "Hugo" },
  event: { startsAt: STARTS_AT },
  venue: { name: "Salle des Fêtes" },
};

export const HEAVY_WEDDING: InvitationData = {
  couple: {
    partner1: "Marie-Charlotte",
    partner2: "Jean-Baptiste",
    monogram: "MC · JB",
    portrait: picture("Portrait", 20),
  },
  event: { startsAt: STARTS_AT, rsvpDeadline: demoDate(3), timezone: "Europe/Paris" },
  venue: {
    name: "Le Prieuré de Saint-Étienne-de-la-Montagne-Noire",
    city: "Annecy-le-Vieux",
    country: "France",
    address: "1280 chemin des Vignes de la Combe Noire, 74940 Annecy-le-Vieux",
    mapsUrl: "https://maps.example.com/?q=prieure",
    wazeUrl: "https://waze.example.com/?q=prieure",
    image: picture("Le lieu", 150),
    access: [
      { mode: "En train", details: ["Gare d'Annecy", "Navette gratuite toutes les 20 minutes de 14 h à 17 h"] },
      { mode: "En voiture", details: ["Parking gratuit sur place", "Prévoir 15 minutes depuis le centre", "Dernier tronçon en chemin de terre : évitez les talons fins"] },
      { mode: "En avion", details: ["Genève Cointrin", "Une heure de route, location de voiture recommandée"] },
      { mode: "Covoiturage", details: ["Un tableau commun pour partager vos trajets"], link: { url: "https://covoit.example.com/mcjb", label: "Ouvrir le tableau de covoiturage" } },
      { mode: "Taxi", details: ["Réservez le retour avant 22 h, la zone est peu desservie"] },
      { mode: "Vélo", details: ["Piste cyclable depuis le lac, 25 minutes"] },
    ],
  },
  copy: {
    heroKicker: "Ils se disent oui au bord du lac, entourés de ceux qu'ils aiment le plus au monde",
    announcement:
      "Après onze ans, trois déménagements et un chat nommé Raymond, nous avons décidé de faire de cette histoire un vrai mariage avec vous tous.",
    dateLabel: "12 · 09 · 2027",
    dateSpelled: "Samedi douze septembre",
    venueIntro:
      "Un ancien prieuré restauré, ses jardins en terrasses, son verger et, en bas, le lac qui change de couleur toute la journée.",
    scheduleIntro: "Une journée qui commence doucement et se termine tard, avec des pauses pour respirer.",
    rsvpIntro: "Merci de nous dire si vous serez là, et si vous avez le moindre souci d'organisation.",
    rsvpNote: "Réponse attendue avant le 12 juin.",
    playlistIntro: "Dites-nous quelle chanson vous fera quitter votre chaise.",
    staysIntro: "Nous avons négocié des tarifs dans plusieurs adresses autour du lac.",
    closing: "Merci d'être là, vraiment.",
    footerNote: "Avec toute notre affection",
  },
  schedule: [
    { day: 1, time: "14 h 30", title: "Accueil des invités", description: "Café, thé glacé et petits sablés dans le verger.", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "15 h 30", title: "Cérémonie laïque", description: "Sous le grand tilleul, avec quatre lectures et un peu de musique.", icon: "ceremony", event: "wedding-day", image: picture("Cérémonie", 330) },
    { day: 1, time: "16 h 30", title: "Photos de groupe", description: "Dix minutes, promis. Ensuite, c'est apéro.", event: "wedding-day" },
    { day: 1, time: "17 h 00", title: "Cocktail sur la terrasse", description: "Spritz, jus de pomme du verger, tapas de saison.", icon: "cocktail", event: "wedding-day" },
    { day: 1, time: "19 h 30", title: "Dîner sous la grange", description: "Un menu en quatre services imaginé avec le traiteur du village.", icon: "dinner", event: "wedding-day" },
    { day: 1, time: "21 h 30", title: "Discours et première danse", icon: "party", event: "wedding-day" },
    { day: 1, time: "22 h 00", title: "Soirée dansante", description: "Le DJ s'installe, la piste s'ouvre.", icon: "party", event: "wedding-day" },
    { day: 1, time: "01 h 30", title: "Dernier verre", description: "Navettes pour les hôtels toutes les trente minutes.", event: "wedding-day" },
    { day: 1, time: "19 h 00", title: "Dîner de bienvenue", description: "Pizzas au feu de bois sur la place du village.", icon: "dinner", event: "welcome-dinner" },
    { day: 2, time: "11 h 00", title: "Brunch au jardin", description: "Oeufs, viennoiseries, café à volonté.", icon: "brunch", event: "brunch" },
    { day: 2, time: "14 h 00", title: "Balade au bord du lac", event: "brunch" },
    { day: 2, time: "16 h 00", title: "Au revoir", description: "Et merci pour tout.", event: "brunch" },
  ],
  events: [
    { kind: "welcome-dinner", name: "Dîner de bienvenue", date: demoDate(5).slice(0, 10), time: "19 h 00", address: "Place de la Mairie, 74940 Annecy-le-Vieux", description: "La veille, pour se retrouver avant le grand jour.", dressCode: "Décontracté", day: 1 },
    { kind: "wedding-day", name: "Le mariage", date: demoDate(5).slice(0, 10), time: "15 h 30", address: "Le Prieuré, chemin des Vignes de la Combe Noire", description: "La cérémonie, le dîner, la fête.", dressCode: "Cocktail estival", day: 1 },
    { kind: "brunch", name: "Brunch du lendemain", date: demoDayAfter(5).slice(0, 10), time: "11 h 00", address: "Le Prieuré, jardin", description: "Pour se dire au revoir sans se presser.", dressCode: "Tenue de balade", day: 2 },
  ],
  dayTwo: {
    dateLabel: "Dimanche treize septembre",
    title: "Le brunch du lendemain",
    timeLabel: "À partir de 11 h 00",
    body: "Un dernier moment ensemble au jardin, pour raconter la soirée et se dire à bientôt.",
    note: "Ceux qui dorment sur place sont attendus pour le petit-déjeuner dès 9 h.",
    image: picture("Brunch", 40),
  },
  gifts: {
    title: "Votre présence est notre plus beau cadeau",
    body: "Si vous souhaitez tout de même nous gâter, une cagnotte est ouverte pour notre voyage de noces en Islande.",
    url: "https://cagnotte.example.com/mcjb",
    linkLabel: "Participer à notre voyage de noces",
  },
  dressCode: {
    title: "Cocktail estival, ni blanc ni noir",
    body: "Pensez au soleil de septembre et aux pelouses : des matières légères, des chaussures qui ne craignent pas l'herbe.",
    colors: ["#c8a27a", "#7d8f69", "#d9b8a0", "#4a5d73", "#b86f52", "#e5d3b3", "#8a6f9e", "#2f4f4f"],
    note: "Le blanc, l'ivoire et le crème sont réservés à la mariée.",
    image: picture("Dress code", 200),
  },
  menu: {
    sections: [
      { title: "Pour commencer", items: [{ title: "Velouté de petits pois, chèvre frais et menthe", description: "Servi froid, avec un filet d'huile d'olive de la Drôme" }, { title: "Tartare de truite du lac", description: "Condiment citron vert et baies roses" }] },
      { title: "Le plat", items: [{ title: "Suprême de volaille fermière, jus corsé aux morilles", description: "Gratin dauphinois et légumes du jardin" }, { title: "Risotto crémeux aux cèpes", description: "Version végétarienne, parmesan affiné 24 mois" }] },
      { title: "Fromages", items: [{ title: "Plateau de fromages de Savoie" }] },
      { title: "Pour finir", items: [{ title: "La pièce montée du boulanger du village", description: "Choux caramélisés, crème à la vanille bourbon" }] },
    ],
    note: "Menu végétarien et sans gluten sur demande, à préciser dans votre réponse.",
    footer: ["Vins de Savoie sélectionnés par Hugo", "Café et infusions à volonté"],
  },
  // The one file on disk: a video cannot be inlined. Any short clip does, so a
  // theme's own assets are borrowed rather than a file added for the fixture.
  introVideo: {
    title: "Un petit film avant le grand jour",
    subtitle: "Tourné l'été dernier, au bord du lac",
    body: "Deux minutes pour vous montrer les lieux, et vous donner envie de nous rejoindre le jour venu.",
    url: "/themes/belle-rive/cocktails.mp4",
    kind: "file",
  },
  gallery: { images: [picture("Souvenir 1", 10), picture("Souvenir 2", 80), picture("Souvenir 3", 160), picture("Souvenir 4", 240), picture("Souvenir 5", 300), picture("Souvenir 6", 350)] },
  stays: Array.from({ length: 10 }, (_, index) => ({
    name: ["Hôtel du Lac", "Auberge des Trois Sapins", "Chambres d'hôtes Les Glycines", "Résidence Belle Vue", "Camping des Pins", "Gîte du Châtaignier", "Hôtel de la Poste", "Maison Berthod", "Le Chalet Fleuri", "Villa Marguerite"][index]!,
    city: index % 2 === 0 ? "Annecy" : "Annecy-le-Vieux",
    address: `${12 + index} rue des Tilleuls`,
    distance: `${5 + index * 3} min`,
    offer: index === 0 ? "-15 % avec le code PRIEURE" : undefined,
    bookingCode: index === 0 ? "PRIEURE" : undefined,
    url: index % 3 === 0 ? `https://hotel${index}.example.com` : undefined,
    phone: index === 1 ? "04 50 12 34 56" : undefined,
    image: index < 2 ? picture(`Hébergement ${index + 1}`, 30 + index * 40) : undefined,
    secondary: index >= 7,
  })),
  faq: Array.from({ length: 12 }, (_, index) => ({
    question: `Question ${index + 1} : ${["Y a-t-il un parking", "Peut-on venir avec un chien", "Que faire en cas de pluie", "Les enfants sont-ils les bienvenus", "À quelle heure finit la soirée", "Peut-on prendre des photos pendant la cérémonie", "Y a-t-il des chambres sur place", "Comment rentrer à l'hôtel", "Quelle est la météo en septembre", "Où poser une valise avant la cérémonie", "Faut-il apporter un cadeau", "À qui s'adresser le jour même"][index]} ?`,
    answer: "Une réponse volontairement longue, pour vérifier qu'elle passe à la ligne sans casser la mise en page, ni dans une colonne étroite sur mobile, ni dans un panneau animé qui doit calculer sa hauteur. ".repeat(index % 3 === 0 ? 3 : 1).trim(),
  })),
  playlist: [
    { title: "Là où je t'emmènerai", artist: "Julien Doré" },
    { title: "La Vie en rose", artist: "Édith Piaf" },
    { title: "Dancing Queen", artist: "ABBA" },
    { title: "Je te donne", artist: "Jean-Jacques Goldman" },
    { title: "Valerie", artist: "Amy Winehouse" },
  ],
  rsvp: {
    allowPartner: true,
    allowChildren: false,
    dietaryOptions: ["Aucun", "Végétarien", "Vegan", "Sans gluten", "Sans lactose", "Autre"],
    collectMessage: true,
  },
  texts: {
    "faq.title": "Vos questions\nnos réponses",
    "footer.eyebrow": "À très vite",
  },
  dayOf: { slug: "fixture", photos: true },
};

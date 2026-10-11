import { demoDate, demoDayAfter, demoStartsAt } from "../demo-date";
import type { InvitationData } from "../types";
import { DIETARY_OPTIONS_FR } from "@shared/data/dietary-options";

/**
 * Demo content for the "Cabo Verde" theme — the designer's own showcase wedding,
 * a beach ceremony on the island of São Vicente. It is the only file of the
 * theme allowed to hold it: every other file reads `InvitationData`.
 *
 * Differences from the designer's page, on purpose:
 *   - the date rolls (always five months out) and every label is derived from
 *     it, so the countdown never sits at zero;
 *   - the clock is Cape Verde's own, UTC−1 all year. The designer wrote `+01:00`,
 *     which moves the countdown by two hours;
 *   - no photograph is set (venue, dress code, hotels, couple): the painted art
 *     of the theme stands in for the venue, and the control datasets
 *     (`?fixture=heavy`) are what exercise the photo slots.
 */
const STARTS_AT = demoStartsAt(5, "16:30", "-01:00");
const WEDDING_DAY = demoDate(5);
const DAY_AFTER = demoDayAfter(5);

/** The calendar day before an ISO day, computed in UTC like the `demo-date` helpers. */
function dayBefore(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export const CABO_VERDE_DEMO: InvitationData = {
  couple: {
    partner1: "Paula",
    partner2: "Ricardo",
    monogram: "P & R",
  },

  event: {
    startsAt: STARTS_AT,
    rsvpDeadline: demoDate(2),
    timezone: "Atlantic/Cape_Verde",
  },

  venue: {
    name: "Baía das Gatas",
    city: "São Vicente",
    // The designer's venue card says the country in French; it also goes up
    // the boarding pass's band and onto the passport's cover.
    country: "Cap-Vert",
    mapsUrl: "https://maps.google.com/?q=Baia+das+Gatas+Cabo+Verde",
    access: [
      { mode: "Arrivée", details: ["Aéroport Cesária-Évora, São Vicente."] },
      { mode: "Monnaie", details: ["Escudo cap-verdien. L’euro est souvent accepté."] },
      { mode: "Climat", details: ["Chaleur douce et vent marin : prévoyez une étole le soir."] },
      { mode: "Cérémonie", details: ["Prévoyez des chaussures adaptées au sable et une étole pour la soirée."] },
    ],
  },

  copy: {
    heroKicker: "Nous nous marions",
    announcement:
      "Une cérémonie les pieds dans le sable, le bruit des vagues et tous ceux que nous aimons réunis pour célébrer notre histoire.",
    venueIntro: "Une cérémonie pieds nus sur le sable blanc, entre cocotiers, eau turquoise et reliefs volcaniques.",
    playlistIntro: "Trois morceaux ouvrent la danse. Ajoutez celui qui vous fera rejoindre la piste.",
    footerNote: "Avec amour · les pieds dans le sable",
  },

  events: [
    { kind: "welcome-dinner", name: "Bienvenue", date: dayBefore(WEDDING_DAY), time: "19:30", day: 1 },
    { kind: "wedding-day", name: "Le grand jour", date: WEDDING_DAY, time: "16:30", day: 1 },
    { kind: "brunch", name: "Brunch", date: DAY_AFTER, time: "12:00", day: 2 },
  ],

  schedule: [
    {
      day: 1,
      time: "19:30",
      title: "Bienvenue sur la plage",
      description: "Un premier verre ensemble face à l’océan.",
      event: "welcome-dinner",
    },
    {
      day: 1,
      time: "16:30",
      title: "Cérémonie",
      description: "Au bord de l’Atlantique, à Baía das Gatas.",
      event: "wedding-day",
    },
    {
      day: 1,
      time: "18:00",
      title: "Cocktail au coucher du soleil",
      description: "Verres frais, bouchées délicates et musique live.",
      event: "wedding-day",
    },
    {
      day: 1,
      time: "20:30",
      title: "Dîner sous les guirlandes",
      description: "De grandes tablées, des fleurs et l’océan pour horizon.",
      event: "wedding-day",
    },
    {
      day: 1,
      time: "23:30",
      title: "Première danse & fête",
      description: "On ouvre le bal, puis on danse jusqu’au lever du soleil.",
      event: "wedding-day",
    },
    {
      day: 2,
      time: "12:00",
      title: "Brunch pieds nus",
      description: "Un dernier moment ensemble au bord de l’eau.",
      event: "brunch",
    },
  ],

  dressCode: {
    title: "Élégance\nles pieds dans le sable",
    body: "Une allure chic et légère, pensée pour danser face à l’océan. Lin, soie, voile et couleurs tropicales sont les bienvenus.",
    colors: ["#e96b8a", "#ef9f3c", "#e7cf67", "#2d8ca5", "#174f8b", "#7a1232"],
    note: "Le blanc et l’ivoire sont réservés aux mariés.",
  },

  // The modules the designer's page had no section for, written in the same
  // world so that the showcase shows the theme drawing every one of them. No
  // intro film: no clip fits the island (the `heavy` control dataset has one).
  menu: {
    sections: [
      {
        title: "Pour commencer",
        items: [
          { title: "Pastéis de thon", description: "Chaussons croustillants, piment doux de l’île" },
          { title: "Ceviche de wahoo", description: "Citron vert, lait de coco et coriandre fraîche" },
        ],
      },
      {
        title: "Le plat",
        items: [
          { title: "Langouste grillée au feu de bois", description: "Beurre aux herbes, riz au coco" },
          { title: "Cachupa rica", description: "Le plat de l’archipel, maïs et haricots mijotés — en version végétarienne" },
        ],
      },
      {
        title: "Pour finir",
        items: [
          { title: "Pudim de queijo", description: "Flan au fromage frais et confiture de papaye" },
          { title: "Mangue et fruits de la passion" },
        ],
      },
    ],
    note: "Ponche et grogue servis au coucher du soleil.",
    footer: ["Vins de Chã das Caldeiras", "Café de São Antão"],
  },

  gallery: {
    images: [
      "/themes/cabo-verde/album-1.webp",
      "/themes/cabo-verde/album-2.webp",
      "/themes/cabo-verde/album-3.webp",
      "/themes/cabo-verde/album-4.webp",
      "/themes/cabo-verde/album-5.webp",
    ],
  },

  faq: [
    {
      question: "Faut-il un visa pour le Cap-Vert ?",
      answer:
        "Les voyageurs européens en sont dispensés. Une préinscription en ligne est demandée quelques jours avant le départ : nous vous enverrons le lien.",
    },
    {
      question: "Comment rejoindre la plage depuis Mindelo ?",
      answer: "Des navettes partent du centre une heure avant la cérémonie et vous ramènent toute la nuit.",
    },
    {
      question: "Quelles chaussures pour la cérémonie ?",
      answer: "Elle a lieu sur le sable : des sandales plates, ou pieds nus si le cœur vous en dit.",
    },
    {
      question: "Et s’il pleut ?",
      answer: "Il ne pleut presque jamais sur l’île. Une grande tente est tout de même prévue au bord de l’eau.",
    },
  ],

  gifts: {
    title: "Un cadeau, si vous y tenez",
    body: "Votre présence au bout du monde est déjà le plus beau des cadeaux. Pour celles et ceux qui le souhaitent, une cagnotte participera à notre voyage de noces d’île en île.",
    url: "https://cagnotte.example.org/paula-ricardo",
    linkLabel: "Participer au voyage",
  },

  // The small line over each name is a hotel's town in a real wedding; the
  // designer used it for a tag on each area (his names are areas, not hotels),
  // and the showcase keeps his words.
  stays: [
    {
      name: "Mindelo centre",
      city: "Ville & musique",
      address: "Hôtels de charme au cœur des restaurants et des rues colorées.",
      distance: "20 min",
    },
    {
      name: "Laginha",
      city: "Plage à pied",
      address: "Chambres lumineuses à quelques pas du sable et du centre.",
      distance: "25 min",
    },
    {
      name: "São Pedro",
      city: "Calme & océan",
      address: "Adresses paisibles, lits face à l’Atlantique et réveils au soleil.",
      distance: "35 min",
    },
  ],

  playlist: [
    { title: "Best Part", artist: "Daniel Caesar feat. H.E.R." },
    { title: "Until I Found You", artist: "Stephen Sanchez" },
    { title: "Sodade", artist: "Cesária Évora" },
  ],

  rsvp: {
    allowPartner: true,
    allowChildren: true,
    dietaryOptions: [...DIETARY_OPTIONS_FR],
    collectMessage: true,
  },

  // The designer's own wording for the showcase. A real wedding gets the
  // catalogue's neutral default until the couple rewrites it.
  texts: {
    "hero.stamp": "Notre mariage · au bord de l’océan",
    "hero.welcomeEyebrow": "Notre mariage au bord de l’océan",
    "hero.welcomeTitle": "Notre plus beau voyage\ncommence avec vous.",
    "countdown.caption": "avant de célébrer notre mariage au bord de l’Atlantique",
    "timeline.eyebrow": "Trois jours · une histoire d’amour",
    "accommodation.title": "Posez vos valises\nà Mindelo",
    "transport.airline": "Cabo Verde Airways",
    "transport.passport": "Passaporte",
  },
};

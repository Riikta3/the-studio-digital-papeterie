/**
 * Fictional invitation and guest data, for validating the Invités and
 * Invitation screens before any of it exists in Supabase. Deleted in step 2.
 *
 * The guest roster is generated with the SAME arithmetic as
 * `jour-j-mock.ts`, so `g-1` is the same person on both sides of the app: the
 * seating plan, the RSVP list and the meal counts all describe one wedding
 * rather than two unrelated datasets.
 */

import type {
  Accommodation,
  DietaryFlag,
  FaqEntry,
  GuestEventStatus,
  GuestGroup,
  Household,
  InvitationData,
  InvitationGuest,
  MealChoice,
  RsvpStatus,
  ScheduleEntry,
  Venue,
  WeddingEvent,
  ZoneLock,
} from "../types/invitation";

/* Kept identical to jour-j-mock.ts — same people, same order. */
const FIRST_NAMES = [
  "Marie", "Jordy", "Émilie", "Lucas", "Chloé", "Antoine", "Sarah", "Thomas",
  "Camille", "Hugo", "Léa", "Maxime", "Julie", "Nicolas", "Manon", "Alexandre",
  "Clara", "Julien", "Inès", "Romain",
];

const LAST_NAMES = [
  "Dupont", "Moreau", "Lefèvre", "Bernard", "Rossi", "Girard", "Fontaine",
  "Mercier", "Blanc", "Roux", "Caron", "Perrin",
];

function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length];
}

/* ------------------------------------------------------------------ *
 * Events
 * ------------------------------------------------------------------ */

const events: WeddingEvent[] = [
  {
    id: "ev-1",
    key: "welcome-dinner",
    name: "Welcome Dinner",
    date: "2027-06-18",
    time: "20h00",
    address: "Trattoria del Porto, Via Marina 12, Amalfi",
    description:
      "Un dîner en petit comité pour accueillir celles et ceux qui arrivent la veille.",
    dressCode: "Tenue décontractée élégante",
    position: 0,
    enabled: true,
  },
  {
    id: "ev-2",
    key: "wedding-day",
    name: "Cérémonie & Réception",
    date: "2027-06-19",
    time: "16h30",
    address: "Villa Bellavista, Via Panoramica 4, Ravello",
    description:
      "Cérémonie dans les jardins, suivie du cocktail puis du dîner sur la terrasse.",
    dressCode: "Tenue de cérémonie — éviter le blanc",
    position: 1,
    enabled: true,
  },
  {
    id: "ev-3",
    key: "brunch",
    name: "Brunch du lendemain",
    date: "2027-06-20",
    time: "11h00",
    address: "Villa Bellavista, jardin bas",
    description: "Pour prolonger un peu, sans protocole.",
    position: 2,
    enabled: true,
  },
  {
    id: "ev-4",
    key: "party",
    name: "Soirée",
    date: "2027-06-19",
    time: "23h00",
    address: "Villa Bellavista, orangerie",
    description: "DJ jusqu'au bout de la nuit.",
    position: 3,
    // Disabled by default, so the screens have an off state to render.
    enabled: false,
  },
];

/* ------------------------------------------------------------------ *
 * Households and guests
 * ------------------------------------------------------------------ */

const GROUPS: GuestGroup[] = ["family", "friends", "colleagues", "other"];

const HOUSEHOLD_COUNT = 48;

function buildHouseholds(): Household[] {
  return Array.from({ length: HOUSEHOLD_COUNT }, (_, i) => ({
    id: `h-${i + 1}`,
    name: `Famille ${pick(LAST_NAMES, i * 5 + 1)}`,
    group: pick(GROUPS, i * 3),
    email: i % 4 === 0 ? undefined : `contact${i + 1}@example.com`,
    phone:
      i % 3 === 0
        ? `+33 6 12 34 ${String(10 + (i % 89)).padStart(2, "0")} ${String(20 + (i % 79)).padStart(2, "0")}`
        : undefined,
  } satisfies Household));
}

const MEALS: MealChoice[] = ["standard", "vegetarian", "vegan", "child"];

function buildGuests(households: Household[]): InvitationGuest[] {
  return Array.from({ length: 140 }, (_, i) => {
    // Same split as jour-j-mock: 124 confirmed, 4 pending, 12 declined.
    const status: RsvpStatus =
      i < 124 ? "confirmed" : i < 128 ? "pending" : "declined";
    const isChild = i % 12 === 0;
    const household = households[i % households.length];

    const dietaryFlags: DietaryFlag[] = [];
    if (i % 14 === 0) dietaryFlags.push("gluten-free");
    if (i % 21 === 0) dietaryFlags.push("lactose-free");
    if (i % 17 === 0) dietaryFlags.push("no-pork");
    if (i % 29 === 0) dietaryFlags.push("halal");

    return {
      id: `g-${i + 1}`,
      firstName: pick(FIRST_NAMES, i * 7 + 1),
      lastName: pick(LAST_NAMES, i * 3 + 2),
      email: i % 5 === 0 ? undefined : `invite${i + 1}@example.com`,
      phone: i % 7 === 0 ? `+33 6 98 76 ${String(10 + (i % 89)).padStart(2, "0")} ${String(30 + (i % 69)).padStart(2, "0")}` : undefined,
      householdId: household.id,
      // Children inherit their household's group rather than getting their own.
      group: isChild ? household.group : pick(GROUPS, i * 3 + 1),
      isChild,
      isPlusOne: i % 19 === 0,
      status,
      meal: isChild ? "child" : i % 9 === 0 ? "vegetarian" : i % 31 === 0 ? "vegan" : "standard",
      dietaryFlags,
      allergies: i % 23 === 0 ? "Fruits à coque" : i % 37 === 0 ? "Fruits de mer" : undefined,
      notes: i % 26 === 0 ? "Arrive la veille" : undefined,
    } satisfies InvitationGuest;
  });
}

/**
 * Per-event answers. The wedding day mirrors `guest.status` so the two never
 * disagree (§24); the side events get their own, sparser answers — plenty of
 * people come to the wedding without staying for the brunch.
 */
function buildGuestEvents(guests: InvitationGuest[]): GuestEventStatus[] {
  const rows: GuestEventStatus[] = [];

  for (const [i, guest] of guests.entries()) {
    // Wedding day: identical to the headline status.
    rows.push({ guestId: guest.id, eventId: "ev-2", status: guest.status });

    // Someone who declined the wedding is not asked about the rest.
    if (guest.status === "declined") continue;

    // Welcome dinner: a smaller circle, mostly family.
    if (guest.group === "family" || i % 4 === 0) {
      rows.push({
        guestId: guest.id,
        eventId: "ev-1",
        status: i % 11 === 0 ? "pending" : i % 6 === 0 ? "declined" : "confirmed",
      });
    }

    // Brunch: open to all, with more drop-off.
    rows.push({
      guestId: guest.id,
      eventId: "ev-3",
      status: i % 3 === 0 ? "declined" : i % 8 === 0 ? "pending" : "confirmed",
    });
  }

  return rows;
}

/* ------------------------------------------------------------------ *
 * Invitation content
 * ------------------------------------------------------------------ */

const schedule: ScheduleEntry[] = [
  { id: "sc-1", eventId: "ev-2", time: "16h30", title: "Accueil des invités", description: "Un rafraîchissement à l'ombre des citronniers.", position: 0 },
  { id: "sc-2", eventId: "ev-2", time: "17h00", title: "Cérémonie", description: "Dans les jardins de la villa.", position: 1 },
  { id: "sc-3", eventId: "ev-2", time: "18h00", title: "Cocktail", description: "Vue sur la baie, musique live.", position: 2 },
  { id: "sc-4", eventId: "ev-2", time: "20h00", title: "Dîner", description: "Sur la terrasse.", position: 3 },
  { id: "sc-5", eventId: "ev-2", time: "22h30", title: "Pièce montée & première danse", position: 4 },
  { id: "sc-6", eventId: "ev-1", time: "20h00", title: "Dîner d'accueil", description: "Trattoria del Porto.", position: 0 },
  { id: "sc-7", eventId: "ev-3", time: "11h00", title: "Brunch", description: "Jardin bas, en toute simplicité.", position: 0 },
];

const venue: Venue = {
  name: "Villa Bellavista",
  address: "Via Panoramica 4",
  city: "Ravello, Italie",
  mapsUrl: "https://maps.google.com/?q=Ravello",
  wazeUrl: "https://waze.com/ul?q=Ravello",
  parkingInfo:
    "Parking privé gratuit dans l'enceinte de la villa, une trentaine de places. Voiturier à partir de 16h.",
  accessInfo:
    "Depuis Naples : 1h30 en voiture par la côte amalfitaine. Route étroite sur les dix derniers kilomètres.",
  transportInfo:
    "Une navette part de Amalfi centre à 15h45 et repart à 1h00. Places limitées, à réserver auprès des mariés.",
  // Placeholder asset; the wiring phase replaces this with a stored upload.
  photoUrl:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=70",
};

const accommodation: Accommodation[] = [
  { id: "ac-1", name: "Hotel Villa Maria", city: "Ravello", distance: "5 min à pied", phone: "+39 089 857 255", bookingUrl: "https://example.com/villa-maria", offer: "Tarif négocié -15% avec le code BELLAVISTA", photoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70", position: 0 },
  { id: "ac-2", name: "Palazzo Avino", city: "Ravello", distance: "10 min à pied", bookingUrl: "https://example.com/palazzo-avino", photoUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=70", position: 1 },
  { id: "ac-3", name: "B&B Il Limoneto", city: "Scala", distance: "12 min en voiture", phone: "+39 089 123 456", offer: "Option la plus abordable", position: 2 },
  { id: "ac-4", name: "Residence Amalfi Coast", city: "Amalfi", distance: "20 min en voiture", bookingUrl: "https://example.com/residence", position: 3 },
];

const faq: FaqEntry[] = [
  { id: "fq-1", question: "Les enfants sont-ils les bienvenus ?", answer: "Oui, avec joie. Un menu enfant et une garderie sont prévus à partir de 20h.", position: 0, published: true },
  { id: "fq-2", question: "Puis-je venir accompagné ?", answer: "Votre invitation précise le nombre de places qui vous sont réservées. N'hésitez pas à nous écrire en cas de doute.", position: 1, published: true },
  { id: "fq-3", question: "Où puis-je me garer ?", answer: "Un parking privé gratuit est accessible dans l'enceinte de la villa, avec voiturier à partir de 16h.", position: 2, published: true },
  { id: "fq-4", question: "Quel est le dress code ?", answer: "Tenue de cérémonie. Les jardins sont en gravier : prévoyez des talons stables, ou de quoi changer.", position: 3, published: true },
  { id: "fq-5", question: "À quelle heure faut-il arriver ?", answer: "L'accueil ouvre à 16h30 et la cérémonie commence à 17h précises.", position: 4, published: true },
  { id: "fq-6", question: "Y a-t-il une liste de mariage ?", answer: "Votre présence nous suffit. Pour celles et ceux qui insistent, une urne sera à disposition.", position: 5, published: false },
];

const zoneLocks: ZoneLock[] = [
  { zone: "schedule", clientEditable: true },
  { zone: "venue", clientEditable: true },
  { zone: "accommodation", clientEditable: true },
  { zone: "faq", clientEditable: true },
  { zone: "menu", clientEditable: true },
  { zone: "playlist", clientEditable: true },
  // The invitation's own wording carries the art direction — The Studio owns it.
  { zone: "texts", clientEditable: false },
];

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

function buildStats() {
  // 30 days ending 2026-06-18, the day before the welcome dinner.
  const visitsByDay = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.UTC(2027, 4, 19 + i));
    // Traffic builds as the date approaches, with a spike when invitations
    // went out on day 6.
    const base = 12 + Math.round(i * 1.8);
    const spike = i === 6 ? 140 : i === 7 ? 60 : 0;
    return { date: d.toISOString().slice(0, 10), visits: base + spike };
  });

  return {
    visits: visitsByDay.reduce((sum, d) => sum + d.visits, 0),
    uniqueVisitors: 214,
    visitsByDay,
  };
}

const households = buildHouseholds();
const guests = buildGuests(households);

export const INVITATION_MOCK: InvitationData = {
  events,
  guestEvents: buildGuestEvents(guests),
  households,
  guests,
  schedule,
  venue,
  accommodation,
  faq,
  zoneLocks,
  stats: buildStats(),
};

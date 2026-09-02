/**
 * The invitation and guest-management shapes — everything the dashboard's
 * Invités and Invitation sections render.
 *
 * Kept apart from `jour-j.ts` on purpose: these describe the run-up to the
 * wedding (who is invited, what they eat, what the invitation says), while the
 * day-of types describe the event itself. Both are final in the same sense —
 * step 2 fills them from Supabase and no component changes.
 */

/* ------------------------------------------------------------------ *
 * Events (§5) — a wedding is several gatherings, not one
 * ------------------------------------------------------------------ */

export const EVENT_KEYS = [
  "welcome-dinner",
  "wedding-day",
  "brunch",
  "party",
] as const;

export type EventKey = (typeof EVENT_KEYS)[number];

export type WeddingEvent = {
  id: string;
  key: EventKey;
  /** The couple's own wording; the key stays stable for logic. */
  name: string;
  /** ISO date, or undefined while the couple has not settled it. */
  date?: string;
  /** Free text, kept verbatim: "17h00", "17 h 00", "5pm". */
  time?: string;
  address?: string;
  description?: string;
  dressCode?: string;
  position: number;
  /** A disabled event is invisible to guests and excluded from counts. */
  enabled: boolean;
};

export type RsvpStatus = "pending" | "confirmed" | "declined";

/** One guest's answer for one event — the §4 "un statut par événement". */
export type GuestEventStatus = {
  guestId: string;
  eventId: string;
  status: RsvpStatus;
};

/* ------------------------------------------------------------------ *
 * Guests, groups and meals (§3)
 * ------------------------------------------------------------------ */

export const GUEST_GROUPS = ["family", "friends", "colleagues", "other"] as const;

export type GuestGroup = (typeof GUEST_GROUPS)[number];

/**
 * Structured meal choices, replacing the free-text `dietary_requirements`
 * the spec flags as inadequate (§3). `allergies` stays free text: a real
 * allergy list cannot be enumerated in advance.
 */
export const MEAL_CHOICES = ["standard", "vegetarian", "vegan", "child"] as const;

export type MealChoice = (typeof MEAL_CHOICES)[number];

export const DIETARY_FLAGS = [
  "gluten-free",
  "lactose-free",
  "no-pork",
  "no-alcohol",
  "halal",
  "kosher",
] as const;

export type DietaryFlag = (typeof DIETARY_FLAGS)[number];

export type InvitationGuest = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  /** Which household they belong to, for grouped invitations and RSVP. */
  householdId: string;
  group: GuestGroup;
  isChild: boolean;
  isPlusOne: boolean;
  /** The headline status, mirroring the main event — see §24. */
  status: RsvpStatus;
  meal: MealChoice;
  dietaryFlags: DietaryFlag[];
  /** Free text; allergies resist enumeration. */
  allergies?: string;
  /** Private to the couple, never shown to guests. */
  notes?: string;
  /** Assigned table, when the couple has seated them. */
  tableId?: string;
};

export type Household = {
  id: string;
  /** "Famille Dupont", "Les Moreau" — the couple's own wording. */
  name: string;
  group: GuestGroup;
  email?: string;
  phone?: string;
  address?: string;
};

/* ------------------------------------------------------------------ *
 * Invitation content (§6, §8, §9)
 * ------------------------------------------------------------------ */

/**
 * A programme entry. `day` separates the wedding day from the day after, so a
 * brunch does not appear between the ceremony and the dinner.
 */
export type ScheduleEntry = {
  id: string;
  eventId: string;
  time: string;
  title: string;
  description?: string;
  position: number;
};

export type Venue = {
  name: string;
  address?: string;
  city?: string;
  mapsUrl?: string;
  wazeUrl?: string;
  parkingInfo?: string;
  accessInfo?: string;
  transportInfo?: string;
};

export type Accommodation = {
  id: string;
  name: string;
  city?: string;
  /** Free text — "à 10 min du domaine". */
  distance?: string;
  phone?: string;
  bookingUrl?: string;
  /** A negotiated rate or code, when the couple arranged one. */
  offer?: string;
  position: number;
};

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  position: number;
  /** Hidden entries stay editable but do not reach the invitation. */
  published: boolean;
};

/**
 * Which zones the couple may edit themselves (§6): The Studio locks the
 * parts that carry the art direction.
 */
export type EditableZone =
  | "schedule"
  | "venue"
  | "accommodation"
  | "faq"
  | "menu"
  | "playlist"
  | "texts";

export type ZoneLock = {
  zone: EditableZone;
  /** false = "verrouillé par The Studio" */
  clientEditable: boolean;
};

/* ------------------------------------------------------------------ *
 * Analytics (§11) — deliberately simple
 * ------------------------------------------------------------------ */

export type InvitationStats = {
  visits: number;
  uniqueVisitors: number;
  /** Visits per day, oldest first, for a small sparkline. */
  visitsByDay: Array<{ date: string; visits: number }>;
};

/** Everything the invitation and guest screens need, from one source. */
export type InvitationData = {
  events: WeddingEvent[];
  guestEvents: GuestEventStatus[];
  households: Household[];
  guests: InvitationGuest[];
  schedule: ScheduleEntry[];
  venue: Venue;
  accommodation: Accommodation[];
  faq: FaqEntry[];
  zoneLocks: ZoneLock[];
  stats: InvitationStats;
};

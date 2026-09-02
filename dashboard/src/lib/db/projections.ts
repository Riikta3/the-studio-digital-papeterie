/**
 * Client-facing projections: what a given screen is allowed to receive, not
 * what the database happens to hold. Four client components (seating board,
 * groups list, meals screen, guest media grid) currently get the full guest
 * roster — email, phone, private notes, allergies — none of which they
 * display. These functions are the boundary between the two.
 *
 * Each one builds an explicit object literal naming every kept field. No
 * `{ email, ...rest }`: a field added to `InvitationGuest` (or `Household`)
 * later must NOT flow through by default. Enumeration fails visibly when a
 * screen is missing a field it needs; rest-spread would leak silently when a
 * screen gains a field it must not have.
 */

import type { InvitationGuest, Household, RsvpStatus } from "@shared/types/invitation";
import type { GuestMedia } from "@shared/types/jour-j";

/* ------------------------------------------------------------------ *
 * Seating board
 * ------------------------------------------------------------------ */

export type SeatingGuest = {
  id: string;
  firstName: string;
  lastName: string;
  isChild: boolean;
  status: RsvpStatus;
  tableId?: string;
};

/**
 * What the seating board is allowed to know. Names stay — a seating plan
 * without names cannot be used — but nothing else does: no contact details,
 * no private notes, no dietary information (that screen is `/guests/repas`).
 */
export function toSeatingGuest(g: InvitationGuest): SeatingGuest {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    isChild: g.isChild,
    status: g.status,
    tableId: g.tableId,
  };
}

/* ------------------------------------------------------------------ *
 * Groups
 * ------------------------------------------------------------------ */

export type GroupsGuest = {
  id: string;
  firstName: string;
  lastName: string;
  householdId: string;
  group: InvitationGuest["group"];
  isChild: boolean;
  isPlusOne: boolean;
  status: RsvpStatus;
};

/**
 * What the groups screen needs to sort guests into households and parties.
 * No contact details, no private notes, no dietary information: that screen
 * organises who belongs where, not what they eat or how to reach them.
 */
export function toGroupsGuest(g: InvitationGuest): GroupsGuest {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    householdId: g.householdId,
    group: g.group,
    isChild: g.isChild,
    isPlusOne: g.isPlusOne,
    status: g.status,
  };
}

export type GroupsHousehold = {
  id: string;
  name: string;
  group: Household["group"];
};

/**
 * Same boundary as `toGroupsGuest`, for households: the groups screen needs
 * a household's name and party to display it, never its contact details.
 */
export function toGroupsHousehold(h: Household): GroupsHousehold {
  return {
    id: h.id,
    name: h.name,
    group: h.group,
  };
}

/* ------------------------------------------------------------------ *
 * Meals
 * ------------------------------------------------------------------ */

export type MealsGuest = {
  id: string;
  firstName: string;
  lastName: string;
  householdId: string;
  isChild: boolean;
  meal: InvitationGuest["meal"];
  dietaryFlags: InvitationGuest["dietaryFlags"];
  allergies?: string;
};

/**
 * The meals screen displays allergies and dietary flags: they are its
 * subject, so they stay. Contact details and private notes are not its
 * subject, so they are dropped like everywhere else.
 */
export function toMealsGuest(g: InvitationGuest): MealsGuest {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName,
    householdId: g.householdId,
    isChild: g.isChild,
    meal: g.meal,
    dietaryFlags: g.dietaryFlags,
    allergies: g.allergies,
  };
}

/* ------------------------------------------------------------------ *
 * Guest media
 * ------------------------------------------------------------------ */

/**
 * A guest can hide a photo or video from the shared gallery. `hidden` items
 * stay in the database for the couple to moderate, but must never reach a
 * client component that renders the gallery itself.
 */
export function visibleMedia(media: GuestMedia[]): GuestMedia[] {
  return media.filter((m) => m.hidden === false);
}

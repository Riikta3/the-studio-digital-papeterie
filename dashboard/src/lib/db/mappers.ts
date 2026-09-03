/**
 * snake_case (Postgres) <-> camelCase (app types) conversion, one pair per
 * domain. No business logic lives here: these functions rename fields and
 * turn `null` into `undefined`, because the app types use `?` rather than
 * `| null`. `dietary_flags` is the one exception — it becomes `[]`, since
 * every caller iterates it without a null check.
 *
 * `guests.dietary_requirements` is a deprecated column and is deliberately
 * absent below: nothing here reads or writes it.
 */

import type {
  WeddingEvent,
  InvitationGuest,
  Household,
  ScheduleEntry,
  Venue,
  Accommodation,
  FaqEntry,
} from "@shared/types/invitation";
import type {
  DayOfTable,
  MenuCategory,
  MenuItem,
  GuestMedia,
} from "@shared/types/jour-j";

/** `null` and `undefined` both collapse to `undefined`; `0`/`false`/`""` pass through. */
function orUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value;
}

/* ------------------------------------------------------------------ *
 * Events
 * ------------------------------------------------------------------ */

export function rowToEvent(row: Record<string, unknown>): WeddingEvent {
  return {
    id: row.id as string,
    key: row.key as WeddingEvent["key"],
    name: row.name as string,
    // `date` is a Postgres `date`, already "YYYY-MM-DD" — no Date() round-trip.
    date: orUndefined(row.date as string | null),
    time: orUndefined(row.time as string | null),
    address: orUndefined(row.address as string | null),
    description: orUndefined(row.description as string | null),
    dressCode: orUndefined(row.dress_code as string | null),
    position: row.position as number,
    enabled: row.enabled as boolean,
  };
}

export function eventToRow(e: WeddingEvent): Record<string, unknown> {
  return {
    id: e.id,
    key: e.key,
    name: e.name,
    date: e.date ?? null,
    time: e.time ?? null,
    address: e.address ?? null,
    description: e.description ?? null,
    dress_code: e.dressCode ?? null,
    position: e.position,
    enabled: e.enabled,
  };
}

/* ------------------------------------------------------------------ *
 * Guests
 * ------------------------------------------------------------------ */

export function rowToGuest(row: Record<string, unknown>): InvitationGuest {
  return {
    id: row.id as string,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    email: orUndefined(row.email as string | null),
    phone: orUndefined(row.phone as string | null),
    householdId: row.household_id as string,
    // `group` is a reserved SQL word; the column is `guest_group`.
    group: row.guest_group as InvitationGuest["group"],
    isChild: row.is_child as boolean,
    isPlusOne: row.is_plus_one as boolean,
    status: row.status as InvitationGuest["status"],
    meal: row.meal as InvitationGuest["meal"],
    dietaryFlags: (row.dietary_flags as InvitationGuest["dietaryFlags"] | null) ?? [],
    allergies: orUndefined(row.allergies as string | null),
    notes: orUndefined(row.notes as string | null),
    tableId: orUndefined(row.table_id as string | null),
  };
}

export function guestToRow(g: InvitationGuest): Record<string, unknown> {
  return {
    id: g.id,
    first_name: g.firstName,
    last_name: g.lastName,
    email: g.email ?? null,
    phone: g.phone ?? null,
    household_id: g.householdId,
    guest_group: g.group,
    is_child: g.isChild,
    is_plus_one: g.isPlusOne,
    status: g.status,
    meal: g.meal,
    dietary_flags: g.dietaryFlags,
    allergies: g.allergies ?? null,
    notes: g.notes ?? null,
    table_id: g.tableId ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Households
 * ------------------------------------------------------------------ */

export function rowToHousehold(row: Record<string, unknown>): Household {
  return {
    id: row.id as string,
    name: row.name as string,
    // Same reserved-word dodge as guests: `group` <-> `guest_group`.
    group: row.guest_group as Household["group"],
    email: orUndefined(row.email as string | null),
    phone: orUndefined(row.phone as string | null),
    address: orUndefined(row.address as string | null),
  };
}

export function householdToRow(h: Household): Record<string, unknown> {
  return {
    id: h.id,
    name: h.name,
    guest_group: h.group,
    email: h.email ?? null,
    phone: h.phone ?? null,
    address: h.address ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Tables
 * ------------------------------------------------------------------ */

export function rowToTable(
  row: Record<string, unknown>,
  guestIds: string[],
): DayOfTable {
  return {
    id: row.id as string,
    name: row.name as string,
    seatsLabel: orUndefined(row.seats_label as string | null),
    shape: row.shape as DayOfTable["shape"],
    capacity: row.capacity as number,
    x: row.x as number,
    y: row.y as number,
    position: row.position as number,
    // Not a column: rebuilt from guests.table_id, handed in by the caller.
    guestIds,
  };
}

export function tableToRow(t: DayOfTable): Record<string, unknown> {
  return {
    id: t.id,
    name: t.name,
    seats_label: t.seatsLabel ?? null,
    shape: t.shape,
    capacity: t.capacity,
    x: t.x,
    y: t.y,
    position: t.position,
  };
}

/* ------------------------------------------------------------------ *
 * Schedule entries
 * ------------------------------------------------------------------ */

export function rowToScheduleEntry(row: Record<string, unknown>): ScheduleEntry {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    time: row.time as string,
    title: row.title as string,
    description: orUndefined(row.description as string | null),
    position: row.position as number,
  };
}

export function scheduleEntryToRow(s: ScheduleEntry): Record<string, unknown> {
  return {
    id: s.id,
    event_id: s.eventId,
    time: s.time,
    title: s.title,
    description: s.description ?? null,
    position: s.position,
  };
}

/* ------------------------------------------------------------------ *
 * Venue
 * ------------------------------------------------------------------ */

export function rowToVenue(row: Record<string, unknown>): Venue {
  return {
    name: row.name as string,
    address: orUndefined(row.address as string | null),
    city: orUndefined(row.city as string | null),
    mapsUrl: orUndefined(row.maps_url as string | null),
    wazeUrl: orUndefined(row.waze_url as string | null),
    parkingInfo: orUndefined(row.parking_info as string | null),
    accessInfo: orUndefined(row.access_info as string | null),
    transportInfo: orUndefined(row.transport_info as string | null),
    photoUrl: orUndefined(row.photo_url as string | null),
  };
}

export function venueToRow(v: Venue): Record<string, unknown> {
  return {
    name: v.name,
    address: v.address ?? null,
    city: v.city ?? null,
    maps_url: v.mapsUrl ?? null,
    waze_url: v.wazeUrl ?? null,
    parking_info: v.parkingInfo ?? null,
    access_info: v.accessInfo ?? null,
    transport_info: v.transportInfo ?? null,
    photo_url: v.photoUrl ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Accommodations
 * ------------------------------------------------------------------ */

export function rowToAccommodation(row: Record<string, unknown>): Accommodation {
  return {
    id: row.id as string,
    name: row.name as string,
    city: orUndefined(row.city as string | null),
    distance: orUndefined(row.distance as string | null),
    phone: orUndefined(row.phone as string | null),
    bookingUrl: orUndefined(row.booking_url as string | null),
    offer: orUndefined(row.offer as string | null),
    photoUrl: orUndefined(row.photo_url as string | null),
    position: row.position as number,
  };
}

export function accommodationToRow(a: Accommodation): Record<string, unknown> {
  return {
    id: a.id,
    name: a.name,
    city: a.city ?? null,
    distance: a.distance ?? null,
    phone: a.phone ?? null,
    booking_url: a.bookingUrl ?? null,
    offer: a.offer ?? null,
    photo_url: a.photoUrl ?? null,
    position: a.position,
  };
}

/* ------------------------------------------------------------------ *
 * FAQ
 * ------------------------------------------------------------------ */

export function rowToFaqEntry(row: Record<string, unknown>): FaqEntry {
  return {
    id: row.id as string,
    question: row.question as string,
    answer: row.answer as string,
    position: row.position as number,
    published: row.published as boolean,
  };
}

export function faqEntryToRow(f: FaqEntry): Record<string, unknown> {
  return {
    id: f.id,
    question: f.question,
    answer: f.answer,
    position: f.position,
    published: f.published,
  };
}

/* ------------------------------------------------------------------ *
 * Menu
 * ------------------------------------------------------------------ */

export function rowToMenuCategory(
  row: Record<string, unknown>,
  items: MenuItem[],
): MenuCategory {
  return {
    id: row.id as string,
    key: row.key as MenuCategory["key"],
    enabled: row.enabled as boolean,
    position: row.position as number,
    items,
  };
}

export function menuCategoryToRow(c: MenuCategory): Record<string, unknown> {
  return {
    id: c.id,
    key: c.key,
    enabled: c.enabled,
    position: c.position,
  };
}

export function rowToMenuItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: orUndefined(row.description as string | null),
    variant: orUndefined(row.variant as MenuItem["variant"] | null),
  };
}

export function menuItemToRow(i: MenuItem): Record<string, unknown> {
  return {
    id: i.id,
    name: i.name,
    description: i.description ?? null,
    variant: i.variant ?? null,
  };
}

/* ------------------------------------------------------------------ *
 * Guest media
 * ------------------------------------------------------------------ */

/**
 * `url`/`thumbUrl` are signed URLs generated server-side, not columns —
 * the caller signs `storage_path`/`thumb_path` and hands the results in.
 */
export function rowToGuestMedia(
  row: Record<string, unknown>,
  signedUrl: string,
  signedThumbUrl: string,
): GuestMedia {
  return {
    id: row.id as string,
    kind: row.kind as GuestMedia["kind"],
    url: signedUrl,
    thumbUrl: signedThumbUrl,
    uploaderName: orUndefined(row.uploader_name as string | null),
    uploadedAt: row.created_at as string,
    hidden: row.hidden as boolean,
  };
}

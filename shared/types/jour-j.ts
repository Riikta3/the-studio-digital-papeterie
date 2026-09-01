/**
 * The day-of module's data shape — shared by the couple's dashboard and the
 * guest-facing page in `landing/`.
 *
 * These types are final: step 1 fills them from a mock file, step 2 fills them
 * from Supabase, and no component in between knows the difference.
 */

export type TableShape = "round" | "rectangle" | "long";

/** A guest, reduced to what the day-of screens actually render. */
export type DayOfGuest = {
  id: string;
  firstName: string;
  lastName: string;
  isChild: boolean;
  /** Only confirmed guests are seatable and searchable from the QR page. */
  status: "pending" | "confirmed" | "declined";
  /** Free text for now; step 4 structures it. */
  dietary?: string;
};

export type DayOfTable = {
  id: string;
  /** "Capri" — the display name the guest sees after scanning. */
  name: string;
  /** "Table 12" — an optional second label printed on the table itself. */
  seatsLabel?: string;
  shape: TableShape;
  capacity: number;
  /** Canvas position, desktop only. Mobile orders by `position`. */
  x: number;
  y: number;
  position: number;
  guestIds: string[];
};

export const MENU_CATEGORY_KEYS = [
  "cocktail",
  "starter",
  "main",
  "cheese",
  "dessert",
  "drinks",
] as const;

export type MenuCategoryKey = (typeof MENU_CATEGORY_KEYS)[number];

/**
 * `variant` is carried from day one but not exposed in V1: the spec defers
 * per-guest menus to a later phase, and having the field now means that phase
 * needs no migration.
 */
export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  variant?: "classic" | "veggie" | "child";
};

export type MenuCategory = {
  id: string;
  key: MenuCategoryKey;
  enabled: boolean;
  position: number;
  items: MenuItem[];
};

export type GuestMedia = {
  id: string;
  kind: "photo" | "video";
  url: string;
  thumbUrl: string;
  uploaderName?: string;
  uploadedAt: string;
  /** Hidden from guests, still visible to the couple. */
  hidden: boolean;
};

export type DayOfSettings = {
  enabled: boolean;
  /** Drives the permanent QR URL. Never regenerated. */
  qrSlug: string;
  /** Whether guests may browse what has been shared. */
  galleryVisibleToGuests: boolean;
  /** ISO date; guests may upload until then. Independent of the flag above. */
  uploadsOpenUntil: string;
  afterWeddingMode: boolean;
  venuePlanUrl?: string;
};

/** Everything the day-of screens need, from one source. */
export type DayOfData = {
  settings: DayOfSettings;
  guests: DayOfGuest[];
  tables: DayOfTable[];
  menu: MenuCategory[];
  media: GuestMedia[];
};

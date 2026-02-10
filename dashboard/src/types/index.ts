// Server Action Result Types
export type ActionResult =
  | { success: true; warning?: string }
  | { success: false; error: string };

export type HouseholdStatus = "pending" | "confirmed" | "declined" | "partial";

export type GuestRelationType =
  | "partner" // Conjoint(e) / Partenaire
  | "spouse" // Époux/Épouse
  | "child" // Enfant
  | "parent" // Parent
  | "sibling" // Frère/Sœur
  | "grandparent" // Grand-parent
  | "grandchild" // Petit-enfant
  | "family" // Autre famille (oncle, tante, cousin, etc.)
  | "friend" // Ami(e)
  | "colleague" // Collègue
  | "plus_one" // Plus-un / Accompagnant(e)
  | "other"; // Autre

export interface Household {
  id: string;
  wedding_id: string;
  name: string; // "Famille Dupont"
  source: "admin" | "public";
  email: string | null;
  phone: string | null;
  address: string | null;
  status: HouseholdStatus;
  message_to_couple: string | null;
  guest_count?: number; // Calculated field
  guests?: Guest[];
  song_request: string | null;
  transportation: string | null;
  created_at: string;
}

export interface Table {
  id: string;
  wedding_id: string;
  name: string;
  shape: "round" | "rectangle";
  capacity: number;
  x_position: number;
  y_position: number;
  guests?: Guest[];
  created_at: string;
}

export interface Guest {
  id: string;
  household_id: string;
  table_id?: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  status: "pending" | "confirmed" | "declined";
  relation_type: GuestRelationType | null;
  is_child: boolean;
  is_plus_one: boolean;
  dietary_requirements: string | null;
  dietary_details: string | null;
  created_at: string;
}

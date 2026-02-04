// Server Action Result Types
export type ActionResult =
  | { success: true; warning?: string }
  | { success: false; error: string };

export type HouseholdStatus = "pending" | "confirmed" | "declined" | "partial";

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

export interface Guest {
  id: string;
  household_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  status: "pending" | "confirmed" | "declined";
  is_child: boolean;
  is_plus_one: boolean;
  dietary_requirements: string | null;
  dietary_details: string | null;
  created_at: string;
}

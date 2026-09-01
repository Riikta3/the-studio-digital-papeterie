import { SeatingScreen } from "@/components/jour-j/seating/SeatingScreen";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function SeatingPlanPage() {
  // Mock data for now — step 2 of the spec swaps this for a Supabase read and
  // nothing below changes.
  const { tables, guests } = JOUR_J_MOCK;
  return <SeatingScreen initialTables={tables} guests={guests} />;
}

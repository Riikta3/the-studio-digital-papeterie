import { listSeating } from "@/actions/seating-actions";
import { SeatingScreen } from "@/components/jour-j/seating/SeatingScreen";

export default async function SeatingPlanPage() {
  const { tables, guests } = await listSeating();
  return <SeatingScreen initialTables={tables} guests={guests} />;
}

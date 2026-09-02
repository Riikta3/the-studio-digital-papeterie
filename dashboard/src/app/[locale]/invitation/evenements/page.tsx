import { EventsEditor } from "@/components/invitation/EventsEditor";
import { listEvents } from "@/actions/events-actions";

export default async function EvenementsPage() {
  const events = await listEvents();
  return <EventsEditor initialEvents={events} />;
}

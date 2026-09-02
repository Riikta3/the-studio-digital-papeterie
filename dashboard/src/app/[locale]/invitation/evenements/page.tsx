import { EventsEditor } from "@/components/invitation/EventsEditor";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";

export default function EvenementsPage() {
  return (
    <EventsEditor
      initialEvents={INVITATION_MOCK.events}
      guestEvents={INVITATION_MOCK.guestEvents}
    />
  );
}

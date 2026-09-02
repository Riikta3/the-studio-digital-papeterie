import { ScheduleEditor } from "@/components/invitation/ScheduleEditor";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";

export default function ProgrammePage() {
  return (
    <ScheduleEditor
      events={INVITATION_MOCK.events}
      initialSchedule={INVITATION_MOCK.schedule}
    />
  );
}

import { ScheduleEditor } from "@/components/invitation/ScheduleEditor";
import { listEvents } from "@/actions/events-actions";
import { listSchedule } from "@/actions/schedule-actions";

export default async function ProgrammePage() {
  const [events, schedule] = await Promise.all([listEvents(), listSchedule()]);

  return <ScheduleEditor events={events} initialSchedule={schedule} />;
}

import { DayOfSettingsForm } from "@/components/jour-j/settings/DayOfSettingsForm";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function DayOfSettingsPage() {
  return <DayOfSettingsForm initialSettings={JOUR_J_MOCK.settings} />;
}

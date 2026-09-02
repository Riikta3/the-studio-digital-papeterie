import { getDayOfSettings } from "@/actions/day-of-settings-actions";
import { DayOfSettingsForm } from "@/components/jour-j/settings/DayOfSettingsForm";

export default async function DayOfSettingsPage() {
  const settings = await getDayOfSettings();
  return <DayOfSettingsForm initialSettings={settings} />;
}

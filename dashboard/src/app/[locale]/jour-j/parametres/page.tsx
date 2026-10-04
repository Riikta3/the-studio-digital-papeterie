import { getDayOfIncluded, getDayOfSettings } from "@/actions/day-of-settings-actions";
import { DayOfSettingsForm } from "@/components/jour-j/settings/DayOfSettingsForm";

export default async function DayOfSettingsPage() {
  const [settings, included] = await Promise.all([getDayOfSettings(), getDayOfIncluded()]);
  return <DayOfSettingsForm initialSettings={settings} included={included} />;
}

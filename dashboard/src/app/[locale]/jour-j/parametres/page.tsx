import {
  getDayOfAddIsFree,
  getDayOfIncluded,
  getDayOfSettings,
} from "@/actions/day-of-settings-actions";
import { DayOfSettingsForm } from "@/components/jour-j/settings/DayOfSettingsForm";

export default async function DayOfSettingsPage() {
  const [settings, included, addIsFree] = await Promise.all([
    getDayOfSettings(),
    getDayOfIncluded(),
    getDayOfAddIsFree(),
  ]);
  return <DayOfSettingsForm initialSettings={settings} included={included} addIsFree={addIsFree} />;
}

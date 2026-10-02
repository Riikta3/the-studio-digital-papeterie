import { getMusicSettings } from "@/actions/music-actions";
import { MusicSettings } from "@/components/music/MusicSettings";

export default async function MusicPage() {
  const settings = await getMusicSettings();
  return <MusicSettings initial={settings} />;
}

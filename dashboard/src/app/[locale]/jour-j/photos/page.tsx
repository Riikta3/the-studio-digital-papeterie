import { MediaGrid } from "@/components/jour-j/media/MediaGrid";
import { JOUR_J_MOCK } from "@shared/data/jour-j-mock";

export default function DayOfPhotosPage() {
  return <MediaGrid initialMedia={JOUR_J_MOCK.media} />;
}

import { listGuestMedia } from "@/actions/guest-media-actions";
import { MediaGrid } from "@/components/jour-j/media/MediaGrid";

export default async function DayOfPhotosPage() {
  const media = await listGuestMedia();
  return <MediaGrid initialMedia={media} />;
}

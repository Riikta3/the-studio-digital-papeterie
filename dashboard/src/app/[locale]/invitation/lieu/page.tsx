import { LieuPageClient } from "@/components/invitation-info/LieuPageClient";
import { getVenue, listAccommodations } from "@/actions/venue-actions";

export default async function Page() {
  const [venue, accommodation] = await Promise.all([
    getVenue(),
    listAccommodations(),
  ]);

  return (
    <LieuPageClient initialVenue={venue} initialAccommodation={accommodation} />
  );
}

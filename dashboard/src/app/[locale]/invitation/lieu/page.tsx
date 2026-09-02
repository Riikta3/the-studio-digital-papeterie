import { LieuPageClient } from "@/components/invitation-info/LieuPageClient";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";

export default function Page() {
  return (
    <LieuPageClient
      initialVenue={INVITATION_MOCK.venue}
      initialAccommodation={INVITATION_MOCK.accommodation}
    />
  );
}

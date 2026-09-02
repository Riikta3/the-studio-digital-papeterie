import { GuestGroupsBoard } from "@/components/guests/GuestGroupsBoard";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";

export default function GuestGroupsPage() {
  return (
    <GuestGroupsBoard
      initialGuests={INVITATION_MOCK.guests}
      households={INVITATION_MOCK.households}
    />
  );
}

import { GuestMealsBoard } from "@/components/guests/GuestMealsBoard";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";

export default function GuestMealsPage() {
  return (
    <GuestMealsBoard
      initialGuests={INVITATION_MOCK.guests}
      households={INVITATION_MOCK.households}
    />
  );
}

import { GuestGroupsBoard } from "@/components/guests/GuestGroupsBoard";
import { listGroupsData } from "@/actions/guest-groups-actions";

// The page projects BEFORE passing the prop, so the client bundle never
// contains an email, a phone number or a private note.
export default async function GuestGroupsPage() {
  const { guests, households } = await listGroupsData();

  return <GuestGroupsBoard initialGuests={guests} households={households} />;
}

import { GuestMealsBoard } from "@/components/guests/GuestMealsBoard";
import { listMealsData } from "@/actions/guest-meals-actions";

// The page projects BEFORE passing the prop, so the client bundle never
// contains an email, a phone number or a private note.
export default async function GuestMealsPage() {
  const { guests, households } = await listMealsData();

  return <GuestMealsBoard initialGuests={guests} households={households} />;
}

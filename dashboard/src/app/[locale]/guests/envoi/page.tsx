import { getSendingData } from "@/actions/invitation-sending-actions";
import { InvitationSendingBoard } from "@/components/guests/InvitationSendingBoard";

// The action projects before the prop crosses to the client: names, phone and
// sending state only — no email, address or note.
export default async function InvitationSendingPage() {
  const data = await getSendingData();

  return <InvitationSendingBoard data={data} />;
}

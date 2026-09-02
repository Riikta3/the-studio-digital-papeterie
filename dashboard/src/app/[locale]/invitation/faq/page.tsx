import { FaqPageClient } from "@/components/invitation-info/FaqPageClient";
import { INVITATION_MOCK } from "@shared/data/invitation-mock";

export default function Page() {
  return <FaqPageClient initialFaq={INVITATION_MOCK.faq} />;
}

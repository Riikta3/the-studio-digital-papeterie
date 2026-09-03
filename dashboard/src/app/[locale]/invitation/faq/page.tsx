import { FaqPageClient } from "@/components/invitation-info/FaqPageClient";
import { listFaq } from "@/actions/faq-actions";

export default async function Page() {
  const faq = await listFaq();
  return <FaqPageClient initialFaq={faq} />;
}

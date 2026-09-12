import { getInvitationCopy } from "@/actions/invitation-copy-actions";
import { NosMotsForm } from "@/components/invitation-info/NosMotsForm";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const [copy, t] = await Promise.all([
    getInvitationCopy(),
    getTranslations("InvitationCopy"),
  ]);

  return (
    <div className='min-h-screen bg-studio-creme p-4 md:p-8 lg:p-12'>
      <div className='mx-auto max-w-2xl'>
        <h1 className='font-heading text-h3 text-studio-violet'>{t("title")}</h1>
        <p className='mt-2 text-sm text-studio-violet/70'>{t("subtitle")}</p>

        <div className='mt-6'>
          <NosMotsForm initial={copy} />
        </div>
      </div>
    </div>
  );
}
